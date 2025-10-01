import React from 'react';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('renders children correctly', () => {
    const testMessage = 'Test Content';
    render(
      <Container>
        <div>{testMessage}</div>
      </Container>
    );
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });
}); 