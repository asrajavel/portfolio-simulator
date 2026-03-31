import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalButton, SIZE } from 'baseui/modal';
import { Textarea } from 'baseui/textarea';
import { LabelSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { TrackerData } from '../../types/tracker';
import { validateTrackerData, VALID_HOLDING_TYPES } from '../validation';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TrackerData) => void;
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
          "name": "Nifty 50 Index",
          "type": "index_fund",
          "indexName": "NIFTY 50",
          "transactions": [
            { "date": "2024-01-15", "amount": 10000 }
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
          "name": "Inflation Hedge",
          "type": "inflation",
          "countryCode": "IND",
          "transactions": [
            { "date": "2024-01-15", "amount": 10000 }
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
  const [json, setJson] = useState(
    currentData ? JSON.stringify(currentData, null, 2) : PLACEHOLDER
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
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
            width: '640px',
            maxWidth: '95vw',
          },
        },
      }}
    >
      <ModalHeader>Import Portfolio Data</ModalHeader>
      <ModalBody>
        <LabelSmall color="contentTertiary" marginBottom="scale400">
          Paste your portfolio JSON below. Data is stored only in your browser.
        </LabelSmall>
        <Textarea
          value={json}
          onChange={(e) => {
            setJson(e.currentTarget.value);
            setError(null);
          }}
          overrides={{
            Input: {
              style: {
                minHeight: '320px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5',
              },
            },
          }}
        />
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
        <ModalButton onClick={handleSubmit} disabled={!json.trim()}>
          Load Data
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
