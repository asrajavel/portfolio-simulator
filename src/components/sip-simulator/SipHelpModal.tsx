import React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'baseui/modal';
import { Button } from 'baseui/button';
import { ParagraphMedium } from 'baseui/typography';
import { Block } from 'baseui/block';

interface SipHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SipHelpModal: React.FC<SipHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalHeader>How SIP Simulation Works</ModalHeader>
      <ModalBody>
        <Block>
          <ParagraphMedium>
            <strong>1. Rolling XIRR:</strong> For each date, we look back at the rolling period (e.g., 5 years) and calculate the XIRR (Extended Internal Rate of Return) for SIP investments made during that window.
          </ParagraphMedium>
          <ParagraphMedium>
            <strong>2. Multiple Funds & Allocation:</strong> You can add multiple instruments to a strategy and specify the allocation percentage for each. The SIP amount is distributed according to these allocations.
          </ParagraphMedium>
          <ParagraphMedium>
            <strong>3. Rebalancing Trigger:</strong> When enabled, the portfolio is automatically rebalanced if any fund's allocation drifts beyond your specified threshold.
          </ParagraphMedium>
          <ParagraphMedium>
            For example, with a 70-30 allocation and 5% threshold:
            <br />
            • If Fund A reaches 76% (70 + 5 + 1), rebalancing is triggered
            <br />
            • If Fund B drops to 24% (30 - 5 - 1), rebalancing is triggered
            <br />
            <br />
            When any fund's allocation differs from target by more than your threshold (e.g., 5%), rebalancing is triggered.
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

