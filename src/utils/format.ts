const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' });

/** All money in the game is stored in cents. */
export const formatMoney = (cents: number) => currency.format(cents / 100);
