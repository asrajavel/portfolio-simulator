import React, { useCallback, useEffect, useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Spinner } from 'baseui/spinner';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { LabelSmall, ParagraphSmall } from 'baseui/typography';
import { TrackerDashboard } from '../tracker/components/TrackerDashboard';
import { JsonEditorModal } from '../tracker/components/JsonEditorModal';
import { computeGoal } from '../tracker/portfolioCalculator';
import { ComputedGoalData, TrackerData } from '../types/tracker';
import { trackTracker } from '../utils/analytics';
import { TRACKER_STORAGE_KEY } from '../constants';

function loadFromStorage(): TrackerData | null {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrackerData;
  } catch {
    return null;
  }
}

function saveToStorage(data: TrackerData) {
  localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data));
}

export const TrackerTab: React.FC = () => {
  const [trackerData, setTrackerData] = useState<TrackerData | null>(loadFromStorage);
  const [activeKey, setActiveKey] = useState<string>('0');
  const [cache, setCache] = useState<Record<number, ComputedGoalData>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

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
  }, [activeIdx, goals.length]);

  const handleDataSubmit = (data: TrackerData) => {
    saveToStorage(data);
    setTrackerData(data);
    setCache({});
    setActiveKey('0');
    trackTracker('ImportData');
  };

  const activeData = cache[activeIdx] || null;

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
          <ParagraphSmall color="contentTertiary">
            No portfolio data loaded. Paste your JSON to get started.
          </ParagraphSmall>
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
