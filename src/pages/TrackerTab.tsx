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

  const loadGoal = useCallback(
    async (idx: number) => {
      if (cache[idx] || !goals[idx]) return;
      setLoading(true);
      setError(null);
      setProgress(`Loading ${goals[idx].name}...`);
      try {
        const result = await computeGoal(goals[idx], (msg) => setProgress(msg));
        setCache((prev) => ({ ...prev, [idx]: result }));
        trackTracker('LoadGoal');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [cache, goals]
  );

  const activeIdx = parseInt(activeKey, 10);

  useEffect(() => {
    if (goals.length > 0 && !cache[activeIdx]) {
      loadGoal(activeIdx);
    }
  }, [activeIdx, trackerData]);

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
          height="400px"
          overrides={{
            Block: {
              style: {
                gap: '16px',
              },
            },
          }}
        >
          {remoteError ? (
            <LabelSmall color="negative">Failed to load remote data: {remoteError}</LabelSmall>
          ) : (
            <ParagraphSmall color="contentTertiary">
              No portfolio data loaded. Paste your JSON to get started.
            </ParagraphSmall>
          )}
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
      <Block display="flex" justifyContent="flex-end" marginBottom="scale200">
        <Button size="mini" kind="tertiary" onClick={() => setEditorOpen(true)}>
          Edit Data
        </Button>
      </Block>

      <Tabs
        activeKey={activeKey}
        onChange={({ activeKey }) => setActiveKey(String(activeKey))}
        activateOnFocus
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
