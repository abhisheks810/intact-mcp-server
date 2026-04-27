# Search Quality V2 Next-Loop Execution Plan

Created: 2026-04-27T13:25:00-04:00
Agent: Codex (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: ready-for-next-loop

## Objective

Execute the next high-value iteration after routing/CI stabilization:

1. improve real-world address ranking quality (not just synthetic benchmark pass),
2. increase benchmark coverage from 250 -> 500 with broader India distribution,
3. harden CI quality gates with anti-regression checks tied to real query behavior.

## Current Baseline (already implemented)

- Deterministic ranking pipeline exists in `geocoder/app.py`.
- CI includes:
  - route coverage gate (`>=75%`) for `backend.routers.route`;
  - address-search benchmark gate:
    - top1 >= 0.75
    - top3 >= 0.90
    - routeable_top1 >= 0.90
- Initial benchmark dataset:
  - `data/search_quality/address_ranking_benchmark_v1_250.json`

## Next-Loop Work Items

### 1) Benchmark Expansion to 500

- Extend `scripts/generate-address-search-benchmark.py` to produce:
  - 500 cases minimum
  - mixed query classes: landmarks, house+street, locality+city, PIN-only, typo/transliteration variants.
- Save as:
  - `data/search_quality/address_ranking_benchmark_v2_500.json`

Acceptance:

- file exists and contains exactly 500 cases;
- schema remains compatible with evaluator.

### 2) Real-Query Evaluation Track

- Add curated real-query dataset:
  - `data/search_quality/address_ranking_real_queries_v1.json`
- Include known examples observed in manual testing:
  - `48 kapoor thala lakhimpur kheri`
  - `chaar minar hyderabad`
  - `india gate`
  - `daliganj lucknow`
  - at least 40 real-style queries.

Acceptance:

- evaluator can run on both synthetic and real-query sets;
- generated report includes failing-case samples.

### 3) Ranking Calibration Pass

- Tune ranking weights (query-token match, postcode, house number, routeable bias, importance) against both datasets.
- Prefer minimizing false top-1 for postcode-only and broad admin boundaries when a more specific routeable candidate exists.

Acceptance:

- real-query dataset target:
  - top1 >= 0.70
  - top3 >= 0.88
  - routeable_top1 >= 0.90
- synthetic 500-case target remains:
  - top1 >= 0.75
  - top3 >= 0.90
  - routeable_top1 >= 0.90

### 4) CI Gate Upgrade

- Update workflow to evaluate both datasets.
- Keep failures actionable by publishing markdown/json reports as artifacts when a gate fails.

Acceptance:

- CI fails with clear metrics and failing examples;
- no build/test stage regressions.

## Execution Commands (next loop)

```bash
cd /Users/abhisheksrivastava/map_platform

python3 scripts/generate-address-search-benchmark.py \
  --cases 500 \
  --output data/search_quality/address_ranking_benchmark_v2_500.json

python3 scripts/evaluate-address-search-quality.py \
  --dataset data/search_quality/address_ranking_benchmark_v2_500.json \
  --min-top1 0.75 \
  --min-top3 0.90 \
  --min-routeable 0.90

python3 scripts/evaluate-address-search-quality.py \
  --dataset data/search_quality/address_ranking_real_queries_v1.json \
  --min-top1 0.70 \
  --min-top3 0.88 \
  --min-routeable 0.90

./scripts/verify.sh
```

## Files Allowed

- `geocoder/app.py`
- `scripts/generate-address-search-benchmark.py`
- `scripts/evaluate-address-search-quality.py`
- `data/search_quality/*.json`
- `.github/workflows/ci.yml`
- `tests/test_geocode_ranking.py`
- docs (`README.md`, `docs/development_interface.md`) if command surface changes

## Risks

- Synthetic benchmarks can overstate quality if not complemented with real-query set.
- Aggressive fuzzy matching can increase false positives; calibration must prioritize precision.
- CI runtime may increase with larger datasets; keep evaluator efficient.

## Deliverables

- Updated dataset(s)
- passing local evaluation reports
- CI workflow update with both dataset gates
- implementation result artifact and run log for traceability
