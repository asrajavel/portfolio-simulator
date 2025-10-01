import xirr from 'xirr';

describe('xirr', () => {
  it('calculates XIRR for the provided values', () => {
    const transactions = [
      { amount: 100, when: new Date('2025-01-01') },
      { amount: 100, when: new Date('2025-02-02') },
      { amount: -220, when: new Date('2025-05-01') },
    ];
    const rate = xirr(transactions);
    // Expected XIRR is about 0.397
    expect(rate).toBeCloseTo(0.397, 3);
  });
}); 