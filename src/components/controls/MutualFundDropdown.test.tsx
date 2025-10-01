import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseProvider, LightTheme } from 'baseui';
import { MutualFundDropdown } from './MutualFundDropdown';
// If you want to add type safety, you can import { mfapiMutualFund } from '../types/mfapiMutualFund';

const mockFunds = [
  { schemeCode: 123, schemeName: 'Fund 1' },
  { schemeCode: 456, schemeName: 'Fund 2' },
];

const mockOnSelect = jest.fn();

describe('MutualFundDropdown', () => {
  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders with placeholder text', () => {
    render(<MutualFundDropdown funds={mockFunds} onSelect={mockOnSelect} />);
    expect(screen.getByPlaceholderText('Type to search mutual funds...')).toBeInTheDocument();
  });

  it('renders options when typing', async () => {
    render(
      <BaseProvider theme={LightTheme}>
        <MutualFundDropdown funds={mockFunds} onSelect={mockOnSelect} />
      </BaseProvider>
    );
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Fund');
    expect(screen.getByText('Fund 1')).toBeInTheDocument();
    expect(screen.getByText('Fund 2')).toBeInTheDocument();
  });

  it('calls onSelect with correct scheme code when a fund is selected', async () => {
    render(
      <BaseProvider theme={LightTheme}>
        <MutualFundDropdown funds={mockFunds} onSelect={mockOnSelect} />
      </BaseProvider>
    );
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Fund');
    await userEvent.click(screen.getByText('Fund 1'));
    expect(mockOnSelect).toHaveBeenCalledWith(123);
  });
}); 