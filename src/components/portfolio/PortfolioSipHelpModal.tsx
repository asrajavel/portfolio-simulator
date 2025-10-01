import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, ParagraphMedium, LabelMedium } from 'baseui/typography';
import { Button } from 'baseui/button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'baseui/modal';

interface PortfolioSipHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortfolioSipHelpModal: React.FC<PortfolioSipHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalHeader>Portfolio SIP Simulator Help</ModalHeader>
      <ModalBody>
        <Block marginBottom="1rem">
          <HeadingMedium marginBottom="0.5rem">What is Rebalancing?</HeadingMedium>
          <ParagraphMedium>
            Rebalancing is the process of bringing your portfolio back to its target allocation when it drifts away due to market movements.
          </ParagraphMedium>
        </Block>

        <Block marginBottom="1rem">
          <LabelMedium 
            marginBottom="0.5rem"
            overrides={{
              Block: {
                style: {
                  fontWeight: '600'
                }
              }
            }}
          >
            How it works:
          </LabelMedium>
          <ParagraphMedium marginBottom="0.5rem">
            <strong>1. Set Target Allocation:</strong> Define what percentage each fund should represent in your portfolio (e.g., 60% Fund A, 40% Fund B).
          </ParagraphMedium>
          <ParagraphMedium marginBottom="0.5rem">
            <strong>3. Rebalancing Threshold:</strong> When any fund's allocation differs from target by more than your threshold (e.g., 5%), rebalancing is triggered.
          </ParagraphMedium>
          <ParagraphMedium>
            <strong>4. Automatic Rebalancing:</strong> The rebalancing happens only on the date of the SIP. You make the purchase on the date of the SIP, then check the new allocation. 
            If the allocation is off by more than the rebalancing threshold, the simulator will rebalance the <b>complete</b> portfolio to the target allocation.
            <br /> <br />
            "Purchasing on SIP date and then rebalancing" - is done to be able to see the allocation going off the target, and then coming back to the target, in the table that shows the allocation of the portfolio over time. (Which shows
            up when you click on any point in the chart.)
          </ParagraphMedium>
        </Block>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose} kind="primary">
          Got it!
        </Button>
      </ModalFooter>
    </Modal>
  );
}; 