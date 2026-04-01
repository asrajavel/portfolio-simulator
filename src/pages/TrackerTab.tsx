import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import { TrackerDashboard } from '../tracker/components/TrackerDashboard';
import { JsonEditorModal } from '../tracker/components/JsonEditorModal';
import { computeGoal } from '../tracker/portfolioCalculator';
import { ComputedGoalData, TrackerData } from '../types/tracker';
import { validateTrackerData } from '../tracker/validation';
import { trackTracker } from '../utils/analytics';

function getHashParam(key: string): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get(key);
}

function toRawGistUrl(url: string): string {
  const match = url.match(/^https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)\/?$/);
  if (match) return `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw`;
  return url;
}

async function fetchRemoteData(url: string): Promise<TrackerData> {
  const res = await fetch(toRawGistUrl(url), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const parsed = await res.json();
  if (!validateTrackerData(parsed)) {
    throw new Error('Remote JSON is not valid tracker data.');
  }
  return parsed;
}

const AI_PROMPT = `Convert my portfolio holdings into the JSON format below.

Output format:
{
  "goals": [
    {
      "name": "Goal Name",
      "holdings": [
        {
          "name": "Fund Name",
          "type": "mutual_fund",
          "schemeCode": 120716,
          "transactions": [
            { "date": "2024-01-15", "amount": 10000 }
          ]
        },
        {
          "name": "Stock Name",
          "type": "yahoo_finance",
          "symbol": "SYMBOL.NS",
          "transactions": [
            { "date": "2024-01-15", "amount": 10000 }
          ]
        },
        {
          "name": "FD @ 7%",
          "type": "fixed_return",
          "annualReturnPercentage": 7,
          "transactions": [
            { "date": "2024-01-15", "amount": 50000 }
          ]
        },
        {
          "name": "PPF",
          "type": "gov_scheme",
          "scheme": "ppf",
          "transactions": [
            { "date": "2024-04-01", "amount": 50000 }
          ]
        }
      ]
    }
  ]
}

Rules:
- Supported types: mutual_fund, yahoo_finance, fixed_return, gov_scheme (ppf/epf)
- Each transaction needs "date" (YYYY-MM-DD) and "amount" (in ₹). Use negative amounts for sell/redemption transactions
- If I don't specify goal names, put all holdings under a single goal called "Portfolio". After generating the JSON, ask me if I'd like to split my holdings into separate goals (e.g. Retirement, Emergency Fund, etc.)
- If any instrument code is missing, or any holding is ambiguous, or you have any questions — ask me to clarify BEFORE generating the JSON. Do not guess
- After generating the JSON, verify: list the total number of holdings and total number of transactions, so you can cross-check nothing was missed, and fix it if required
- Output only the formatted JSON, then the verification summary

My instrument codes (I looked these up already — use these exact codes in the JSON):


My holdings (dates and amounts):
`;

export const TrackerTab: React.FC = () => {
  const initialSrc = getHashParam('src');
  const [trackerData, setTrackerData] = useState<TrackerData | null>(null);
  const [activeKey, setActiveKey] = useState<string>('0');
  const [cache, setCache] = useState<Record<number, ComputedGoalData>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(!!initialSrc);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const didFetchRemote = useRef(false);
  const [promptCopied, setPromptCopied] = useState(false);

  useEffect(() => {
    if (didFetchRemote.current) return;
    if (!initialSrc) return;
    didFetchRemote.current = true;
    setRemoteLoading(true);
    fetchRemoteData(initialSrc)
      .then((data) => {
        setTrackerData(data);
        setCache({});
        setActiveKey('0');
        trackTracker('ImportRemote');
      })
      .catch((e) => {
        setRemoteError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setRemoteLoading(false));
  }, []);

  const goals = trackerData?.goals || [];

  const loadAllGoals = useCallback(
    async () => {
      if (goals.length === 0) return;
      setLoading(true);
      setError(null);
      const newCache: Record<number, ComputedGoalData> = {};
      try {
        for (let i = 0; i < goals.length; i++) {
          setProgress(`Loading ${goals[i].name}...`);
          const result = await computeGoal(goals[i], (msg) => setProgress(msg));
          newCache[i] = result;
        }
        setCache(newCache);
        trackTracker('LoadGoal');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [goals]
  );

  const activeIdx = parseInt(activeKey, 10);

  useEffect(() => {
    if (goals.length > 0 && Object.keys(cache).length === 0) {
      loadAllGoals();
    }
  }, [trackerData]);

  const handleDataSubmit = (data: TrackerData, source?: string) => {
    if (source) {
      window.location.hash = `src=${source}`;
    }
    setTrackerData(data);
    setCache({});
    setActiveKey('0');
    trackTracker('ImportData');
  };

  const activeData = cache[activeIdx] || null;

  if (remoteLoading) {
    return (
      <Block maxWidth="900px" marginLeft="auto" marginRight="auto">
        <Block
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="400px"
        >
          <Spinner />
          <LabelSmall
            color="contentTertiary"
            overrides={{ Block: { style: { marginTop: '16px' } } }}
          >
            Loading data from remote source...
          </LabelSmall>
        </Block>
      </Block>
    );
  }

  if (!trackerData || goals.length === 0) {
    return (
      <Block maxWidth="900px" marginLeft="auto" marginRight="auto">
        <Block
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding="scale800"
          overrides={{
            Block: {
              style: {
                gap: '16px',
                maxWidth: '560px',
                margin: '0 auto',
              },
            },
          }}
        >
          {remoteError && (
            <LabelSmall color="negative">Failed to load remote data: {remoteError}</LabelSmall>
          )}
          <ParagraphSmall color="contentPrimary" overrides={{ Block: { style: { textAlign: 'center', marginBottom: '0' } } }}>
            Track your real portfolio — mutual funds, stocks, FDs, PPF and more.
          </ParagraphSmall>
          <ParagraphSmall color="contentTertiary" overrides={{ Block: { style: { textAlign: 'center', marginTop: '0', marginBottom: '0' } } }}>
            Provide a JSON with your goals and holdings. You can paste it directly or load from a GitHub Gist URL.
          </ParagraphSmall>
          <Block backgroundColor="mono200" padding="scale400" overrides={{ Block: { style: { borderRadius: '8px', width: '100%' } } }}>
            <LabelSmall color="contentTertiary" marginBottom="scale200">Quick start:</LabelSmall>
            <ParagraphSmall overrides={{ Block: { style: { margin: '0', fontSize: '12px', lineHeight: '1.8' } } }}>
              1. Go to the <a href="/portfolio-simulator/historical"><strong>Historical Values</strong></a> tab, search and add all your mutual funds and stocks, then click <strong>Copy for Tracker</strong><br />
              2. Have your holdings data ready — a <strong>CAS statement</strong> (PDF from CAMS/KFintech), or an export/screenshot from <strong>Groww, Kuvera, Zerodha</strong>, etc.<br />
              3. Copy the prompt below into <strong>ChatGPT / Claude</strong>, paste the copied codes from step 1, and your holdings data from step 2<br />
              4. Paste the AI's JSON output here using <strong>Import Data</strong>
            </ParagraphSmall>
            <Block marginTop="scale400">
              <Button
                size="mini"
                kind="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(AI_PROMPT);
                  setPromptCopied(true);
                  setTimeout(() => setPromptCopied(false), 2000);
                }}
                overrides={{
                  BaseButton: {
                    style: {
                      backgroundColor: '#d0d0d0',
                      color: '#444',
                    },
                  },
                }}
              >
                {promptCopied ? 'Copied!' : 'Copy AI Prompt'}
              </Button>
            </Block>
          </Block>
          <Block backgroundColor="mono200" padding="scale400" overrides={{ Block: { style: { borderRadius: '8px', width: '100%' } } }}>
            <LabelSmall color="contentTertiary" marginBottom="scale200">Save & share with GitHub Gist:</LabelSmall>
            <ParagraphSmall overrides={{ Block: { style: { margin: '0', fontSize: '12px', lineHeight: '1.8' } } }}>
              For persistent access, save your JSON in a <strong>GitHub Gist</strong>. Create a <strong>secret gist</strong> — it
              won't appear on your profile or in search, only people with the link can see it.
              Paste the gist URL in the Import Data dialog's URL field — this page's URL will automatically
              update to include your gist link. <strong>Bookmark that URL</strong> to access your portfolio
              anytime, or <strong>share it</strong> with others.
              <br />
              <br />
              This is a fully client-side app with no backend — your data never leaves your browser.
            </ParagraphSmall>
          </Block>
          <Button size="compact" onClick={() => setEditorOpen(true)}>
            Import Data
          </Button>
        </Block>
        {editorOpen && (
          <JsonEditorModal
            isOpen
            onClose={() => setEditorOpen(false)}
            onSubmit={handleDataSubmit}
            currentData={trackerData}
          />
        )}
      </Block>
    );
  }

  return (
    <Block maxWidth="900px" marginLeft="auto" marginRight="auto">
      <Tabs
        activeKey={activeKey}
        onChange={({ activeKey }) => setActiveKey(String(activeKey))}
        activateOnFocus
        endEnhancer={() => (
          <Button size="mini" kind="secondary" onClick={() => setEditorOpen(true)}>
            Edit Data
          </Button>
        )}
      >
        {goals.map((goal, idx) => (
          <Tab key={idx} title={goal.name}>
            {loading && activeIdx === idx ? (
              <Block
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="400px"
              >
                <Spinner />
                <LabelSmall
                  color="contentTertiary"
                  overrides={{ Block: { style: { marginTop: '16px' } } }}
                >
                  {progress}
                </LabelSmall>
              </Block>
            ) : error && activeIdx === idx ? (
              <Block
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="400px"
              >
                <LabelSmall color="negative">Error: {error}</LabelSmall>
              </Block>
            ) : activeData && activeIdx === idx ? (
              <TrackerDashboard data={activeData} />
            ) : null}
          </Tab>
        ))}
      </Tabs>

      {editorOpen && (
        <JsonEditorModal
          isOpen
          onClose={() => setEditorOpen(false)}
          onSubmit={handleDataSubmit}
          currentData={trackerData}
        />
      )}
    </Block>
  );
};
