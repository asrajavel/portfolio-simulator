import React, { useRef, useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, SIZE } from 'baseui/modal';
import { Input } from 'baseui/input';
import { LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import Editor, { type OnMount } from '@monaco-editor/react';
import { TrackerData } from '../../types/tracker';
import { validateTrackerData, VALID_HOLDING_TYPES } from '../validation';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TrackerData, remoteSource?: string) => void;
  currentData: TrackerData | null;
}

const PLACEHOLDER = `{
  "goals": [
    {
      "name": "My Goal",
      "holdings": [
        {
          "name": "Nifty 50 Index Fund",
          "type": "mutual_fund",
          "schemeCode": 120716,
          "transactions": [
            { "date": "2024-01-15", "amount": 10000 },
            { "date": "2024-02-15", "amount": 10000 }
          ]
        },
        {
          "name": "Reliance",
          "type": "yahoo_finance",
          "symbol": "RELIANCE.NS",
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
}`;

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentData,
}) => {
  const initialValue = currentData ? JSON.stringify(currentData, null, 2) : PLACEHOLDER;
  const jsonRef = useRef(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const handleEditorMount: OnMount = (editor) => {
    editor.getAction('editor.action.formatDocument')?.run();
  };

  const toRawGistUrl = (url: string): string => {
    const match = url.match(/^https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)\/?$/);
    if (match) return `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw`;
    return url;
  };

  const handleFetchUrl = async () => {
    if (!sourceUrl.trim()) return;
    setFetchingUrl(true);
    setError(null);
    try {
      const res = await fetch(toRawGistUrl(sourceUrl.trim()), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = JSON.parse(text);
      if (!validateTrackerData(parsed)) {
        setError('Fetched JSON is not valid tracker data.');
        setFetchingUrl(false);
        return;
      }
      onSubmit(parsed, sourceUrl.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch URL');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleSubmit = () => {
    setError(null);
    const value = jsonRef.current;
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError('Invalid JSON. Please check the syntax.');
      return;
    }
    if (!validateTrackerData(parsed)) {
      setError(
        `Invalid format. Each holding needs "name", "type" (${VALID_HOLDING_TYPES.join(', ')}), its type-specific fields, and "transactions" array.`
      );
      return;
    }
    onSubmit(parsed);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      size={SIZE.default}
      unstable_ModalBackdropScroll
      overrides={{
        Dialog: {
          style: {
            width: '720px',
            maxWidth: '95vw',
          },
        },
      }}
    >
      <ModalHeader>Import Portfolio Data</ModalHeader>
      <ModalBody>
        <LabelSmall color="contentTertiary" marginBottom="scale300">
          Load from a URL (e.g. GitHub Gist raw link):
        </LabelSmall>
        <Block display="flex" overrides={{ Block: { style: { gap: '8px' } } }} marginBottom="scale500">
          <Block flex="1">
            <Input
              size="compact"
              value={sourceUrl}
              onChange={(e) => { setSourceUrl(e.currentTarget.value); setError(null); }}
              placeholder="https://gist.githubusercontent.com/..."
            />
          </Block>
          <ModalButton
            size="compact"
            onClick={handleFetchUrl}
            isLoading={fetchingUrl}
            disabled={!sourceUrl.trim() || fetchingUrl}
          >
            Fetch
          </ModalButton>
        </Block>
        <LabelSmall color="contentTertiary" marginBottom="scale400">
          Or paste your portfolio JSON below:
        </LabelSmall>
        <Block overrides={{ Block: { style: { border: '1px solid #e2e2e2', borderRadius: '4px', overflow: 'hidden' } } }}>
          <Editor
            height="320px"
            defaultLanguage="json"
            defaultValue={initialValue}
            onChange={(value) => {
              jsonRef.current = value || '';
              setError(null);
            }}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              wordWrap: 'on',
            }}
          />
        </Block>
        {error && (
          <Block marginTop="scale300">
            <LabelSmall color="negative">{error}</LabelSmall>
          </Block>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton kind="tertiary" onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleSubmit}>
          Load Data
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
