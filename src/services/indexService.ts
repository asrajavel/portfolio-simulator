import { IndexDataResponse, IndexListResponse, ProcessedIndexData } from '../types/index';

class IndexService {
  private indexDataCache: Record<string, ProcessedIndexData[]> = {};
  private indexNamesCache: string[] | null = null;

  async fetchIndexData(indexName: string): Promise<ProcessedIndexData[]> {
    if (this.indexDataCache[indexName]) {
      return this.indexDataCache[indexName];
    }

    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/asrajavel/mf-index-data/main/index%20data/${indexName}.json`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch index data for ${indexName}`);
      }

      const data: IndexDataResponse = await response.json();
      
      // Parse the JSON string inside data.d
      const parsedData: Array<{ Date: string; TotalReturnsIndex: string }> = JSON.parse(data.d);
      const processedData = parsedData.map((item) => {
        // Convert date format from "06 Jun 2025" to a proper Date object (UTC midnight)
        const dateStr = item.Date;
        // Parse as UTC to avoid timezone issues
        const date = new Date(dateStr + ' UTC');
        
        return {
          date: date,
          nav: parseFloat(item.TotalReturnsIndex)
        };
      });

      this.indexDataCache[indexName] = processedData;
      return processedData;
    } catch (error) {
      console.error(`Error fetching index data for ${indexName}:`, error);
      throw error;
    }
  }

  async fetchIndexNames(): Promise<string[]> {
    if (this.indexNamesCache) {
      return this.indexNamesCache;
    }

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/asrajavel/mf-index-data/main/index%20list.json'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch index list');
      }

      const data: IndexListResponse = await response.json();
      const rawIndexNames = data.d.map(item => item.indextype);
      
      // Create mapping of corrected names to actual names
      const correctedToActual: Record<string, string> = {};
      rawIndexNames.forEach(indexName => {
        const correctedName = this.correctIndexName(indexName);
        correctedToActual[correctedName] = indexName;
      });

      // Sort corrected names and store the mapping
      const sortedCorrectedNames = Object.keys(correctedToActual).sort();
      this.indexNamesCache = sortedCorrectedNames.map(correctedName => correctedToActual[correctedName]);
      
      return this.indexNamesCache;
    } catch (error) {
      console.error('Error fetching index names:', error);
      throw error;
    }
  }

  private correctIndexName(indexName: string): string {
    // Add a space before each group of digits and clean up spacing
    return indexName.replace(/(\d+)/g, ' $1').replace(/\s+/g, ' ').trim();
  }

  getDisplayName(indexName: string): string {
    return this.correctIndexName(indexName);
  }

  clearCache(): void {
    this.indexDataCache = {};
    this.indexNamesCache = null;
  }
}

export const indexService = new IndexService();