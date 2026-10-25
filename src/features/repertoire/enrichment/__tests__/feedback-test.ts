import {
  chooseEnrichmentFeedback,
  type EnrichmentFeedbackStage,
} from '../feedback';

describe('chooseEnrichmentFeedback', () => {
  it('oferece ao menos cinco alternativas por estado e evita a repetição consecutiva', () => {
    const stages: EnrichmentFeedbackStage[] = [
      'preparing',
      'searching',
      'ranking',
      'selecting',
      'duration-choice',
      'validating',
      'applying',
      'retry-wait',
      'empty',
      'failed',
      'completed',
    ];

    for (const stage of stages) {
      const alternatives = new Set(
        Array.from({ length: 5 }, (_, index) =>
          chooseEnrichmentFeedback(stage, undefined, () => index / 5),
        ),
      );
      expect(alternatives.size).toBeGreaterThanOrEqual(5);

      for (const message of alternatives) {
        expect(message.trim().length).toBeGreaterThan(0);
        expect(chooseEnrichmentFeedback(stage, message, () => 0)).not.toBe(
          message,
        );
      }
    }
  });

  it('mantém seleção dentro dos limites mesmo que o gerador retorne extremos', () => {
    const first = chooseEnrichmentFeedback('searching', undefined, () => 0);
    const last = chooseEnrichmentFeedback(
      'searching',
      undefined,
      () => 1 - Number.EPSILON,
    );

    expect(chooseEnrichmentFeedback('searching', undefined, () => -1)).toBe(
      first,
    );
    expect(chooseEnrichmentFeedback('searching', undefined, () => 1)).toBe(
      last,
    );
  });
});
