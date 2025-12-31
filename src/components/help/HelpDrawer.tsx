import React from 'react';
import { Drawer, ANCHOR } from 'baseui/drawer';
import { LabelLarge, ParagraphSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { Navigation } from 'baseui/side-navigation';
import { useHelp } from './HelpContext';
import { helpContent, getTopicsByCategory } from './helpContent';

export const HelpDrawer: React.FC = () => {
  const { isOpen, currentTopic, closeHelp, openHelp } = useHelp();

  const topic = currentTopic ? helpContent[currentTopic] : null;
  const categories = getTopicsByCategory();

  // Build navigation items - categories are now clickable
  const navItems = Object.entries(categories).map(([category, { topicId, subTopics }]) => ({
    title: category,
    itemId: topicId, // Category header is now clickable
    subNav: subTopics.map((subTopicId) => ({
      title: helpContent[subTopicId]?.title || subTopicId,
      itemId: subTopicId,
    })),
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeHelp}
      anchor={ANCHOR.right}
      size="auto"
      overrides={{
        Root: {
          style: {
            zIndex: 1000, // Ensure drawer is above LoadingOverlay
          },
        },
        DrawerBody: {
          style: {
            width: '750px',
            maxWidth: '90vw',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            padding: 0,
          },
        },
        DrawerContainer: {
          style: {
            padding: 0,
          },
        },
      }}
    >
      <Block display="flex" height="100%">
        {/* Left sidebar navigation */}
        <Block
          width="220px"
          backgroundColor="backgroundSecondary"
          paddingTop="scale600"
          paddingBottom="scale600"
          paddingLeft="scale400"
          paddingRight="scale400"
          overrides={{
            Block: {
              style: {
                borderRight: '1px solid #e0e0e0',
                overflowY: 'auto',
                minHeight: '100%',
              },
            },
          }}
        >
          <Navigation
            items={navItems}
            activeItemId={currentTopic || ''}
            onChange={({ event, item }) => {
              event.preventDefault();
              // Only navigate if it's a leaf item (has content)
              if (item.itemId && helpContent[item.itemId]) {
                openHelp(item.itemId);
              }
            }}
            overrides={{
              NavItem: {
                style: {
                  fontSize: '13px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                },
              },
            }}
          />
        </Block>

        {/* Right content area */}
        <Block flex="1" padding="scale800" overflow="auto">
          {topic ? (
            <>
              <LabelLarge marginTop="0" marginBottom="scale600">
                {topic.title}
              </LabelLarge>
              <Block>
                {topic.content.split('\n\n').map((paragraph, i) => (
                  <ParagraphSmall 
                    key={i} 
                    marginTop="0" 
                    marginBottom="scale500"
                    overrides={{
                      Block: {
                        style: {
                          lineHeight: '1.6',
                        },
                      },
                    }}
                  >
                    {paragraph.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {formatLine(line)}
                        {j < paragraph.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </ParagraphSmall>
                ))}
              </Block>
            </>
          ) : (
            <ParagraphSmall>Select a topic from the navigation.</ParagraphSmall>
          )}
        </Block>
      </Block>
    </Drawer>
  );
};

// Simple formatting for bold text
const formatLine = (line: string) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

