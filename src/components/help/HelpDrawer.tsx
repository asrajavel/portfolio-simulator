import React from 'react';
import { Drawer, ANCHOR } from 'baseui/drawer';
import { LabelLarge, ParagraphSmall } from 'baseui/typography';
import { Block } from 'baseui/block';
import { Navigation } from 'baseui/side-navigation';
import { StyledLink } from 'baseui/link';
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
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
          },
        },
        DrawerContainer: {
          style: {
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
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

// Simple formatting for bold text and links
const formatLine = (line: string) => {
  // First split by links [text](url), then by bold **text**
  const linkRegex = /(\[[^\]]+\]\([^)]+\))/g;
  const boldRegex = /(\*\*[^*]+\*\*)/g;
  
  const parts = line.split(linkRegex);
  return parts.map((part, i) => {
    // Check if it's a link
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <StyledLink 
          key={i} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </StyledLink>
      );
    }
    
    // Otherwise, handle bold within this part
    const boldParts = part.split(boldRegex);
    return boldParts.map((boldPart, j) => {
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return <strong key={`${i}-${j}`}>{boldPart.slice(2, -2)}</strong>;
      }
      return boldPart;
    });
  });
};

