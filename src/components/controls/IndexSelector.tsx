import React from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { Instrument } from '../../types/instrument';
import { useIndices } from '../../hooks/useIndices';

interface IndexSelectorProps {
  onSelect: (instrument: Instrument) => void;
  value?: Instrument;
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({ 
  onSelect, 
  value 
}) => {
  const { indices, loading: indicesLoading } = useIndices();

  const handleSelect = (params: any) => {
    if (!params.value || params.value.length === 0) return;
    
    const selectedIndex = params.value[0];
    const instrument: Instrument = {
      type: 'index_fund',
      id: selectedIndex.indexName,
      name: selectedIndex.displayName,
      indexName: selectedIndex.indexName,
      displayName: selectedIndex.displayName
    };
    
    onSelect(instrument);
  };

  const indexOptions = indices.map(index => ({
    label: index.displayName,
    id: index.indexName,
    indexName: index.indexName,
    displayName: index.displayName
  }));

  const selectedIndexValue = value && value.type === 'index_fund'
    ? [{ label: value.displayName, id: value.indexName, indexName: value.indexName, displayName: value.displayName }] 
    : [];

  return (
    <Block
      overrides={{
        Block: {
          style: {
            minWidth: '400px',
            flexGrow: 1,
            flexShrink: 1
          }
        }
      }}
    >
      <Select
        options={indexOptions}
        value={selectedIndexValue}
        onChange={handleSelect}
        placeholder={indicesLoading ? "Loading indices..." : "Select an index..."}
        disabled={indicesLoading}
        size="compact"
        clearable={false}
        searchable={true}
        overrides={{
          Root: {
            style: {
              width: '100%'
            }
          }
        }}
      />
    </Block>
  );
};