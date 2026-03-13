import React from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { Asset } from '../../types/asset';
import { useIndices } from '../../hooks/useIndices';

const POPULAR_INDICES = [
  'NIFTY 50', 'NIFTY NEXT 50', 'NIFTY50 EQUAL WEIGHT',
  'NIFTY 100', 'NIFTY100 LOW VOLATILITY 30',
  'NIFTY LARGEMIDCAP 250', 'NIFTY MIDCAP 150', 'NIFTY SMALLCAP 250',
  'NIFTY 500',
];

interface IndexSelectorProps {
  onSelect: (asset: Asset) => void;
  value?: Asset;
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({ 
  onSelect, 
  value 
}) => {
  const { indices, loading: indicesLoading } = useIndices();

  const handleSelect = (params: any) => {
    if (!params.value || params.value.length === 0) return;
    
    const selectedIndex = params.value[0];
    const asset: Asset = {
      type: 'index_fund',
      id: selectedIndex.indexName,
      name: selectedIndex.displayName,
      indexName: selectedIndex.indexName,
      displayName: selectedIndex.displayName
    };
    
    onSelect(asset);
  };

  const toOption = (index: { indexName: string; displayName: string }) => ({
    label: index.displayName,
    id: index.indexName,
    indexName: index.indexName,
    displayName: index.displayName,
  });

  const indicesByName = new Map(indices.map(i => [i.indexName, i]));
  const indexOptions = {
    'Popular Indices': POPULAR_INDICES.filter(name => indicesByName.has(name)).map(name => toOption(indicesByName.get(name)!)),
    'All Indices': indices.map(toOption),
  };

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