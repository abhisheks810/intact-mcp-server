# Patch Proposal: Search Quality V2 Hardening

Created: 2026-04-27T13:26:00-04:00
Agent: Codex (supervised)
Repository: /Users/abhisheksrivastava/map_platform
Status: accepted-for-next-loop
Related task: map-platform-tasks/2026-04-27-search-quality-v2-next-loop.md

## Summary

Prepare the next loop to deliver measurable search relevance improvements by combining:

1. larger benchmark coverage (500 synthetic cases),
2. real-query benchmark track,
3. ranking calibration against both,
4. CI gates that validate both datasets.

## Proposed Changes

### geocoder/app.py

- Refine deterministic ranking weights to reduce false top-1 on broad admin/postcode matches.
- Keep routeable candidates prioritized when text-match quality is comparable.
- Add small safeguards for over-fuzzy token matches (avoid irrelevant locality jumps).

### scripts/generate-address-search-benchmark.py

- Add `v2` dataset mode (500 cases).
- Expand distribution across North/Central/East/West/South/Northeast city patterns.
- Include more typo/transliteration variants.

### scripts/evaluate-address-search-quality.py

- Add support for evaluating multiple datasets in one invocation (optional).
- Persist richer failing-case diagnostics in markdown/json output.

### tests/test_geocode_ranking.py

- Add regression tests for:
  - PIN-only vs full-address preference,
  - transliteration/typo recovery,
  - routeable candidate preference under tie-like scores.

### .github/workflows/ci.yml

- Keep existing route coverage gate.
- Add real-query ranking gate in addition to synthetic benchmark gate.
- Upload search quality reports as workflow artifacts on failure.

## Acceptance Criteria

Synthetic v2 benchmark:
- top1 >= 0.75
- top3 >= 0.90
- routeable_top1 >= 0.90

Real-query benchmark:
- top1 >= 0.70
- top3 >= 0.88
- routeable_top1 >= 0.90

## Verification

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

python3 -m unittest discover -s tests -p "test_*.py" -v
./scripts/verify.sh
```

## Rollback

- Revert only ranking-weight changes in `geocoder/app.py`.
- Keep benchmark tooling and datasets for future calibration even if thresholds are temporarily lowered.
