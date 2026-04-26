export class SessionBudget {
  private spent = 0;
  constructor(private readonly limitUsd: number) {}

  charge(usd: number): void {
    this.spent += usd;
  }

  spent_usd(): number {
    return this.spent;
  }

  remaining(): number {
    return Math.max(0, this.limitUsd - this.spent);
  }

  breakerOpen(): boolean {
    return this.spent > this.limitUsd;
  }
}
