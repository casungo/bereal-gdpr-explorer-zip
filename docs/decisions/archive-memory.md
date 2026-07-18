# Archive memory strategy

## Decision

Keep the existing archive safety limits, but treat **200 MiB expanded media and 200 entries** as the currently measured browser envelope until the import path is lazy. The next production change should preserve the ZIP index and metadata in memory while inflating media only when a view or download asks for a path. Object URLs must be held in an eight-entry LRU cache and revoked on eviction and reset.

This is the smallest change supported by the measurements: on the middle fixture, lazy inflation reduced peak renderer RSS from 491 MiB to 285 MiB (42%) and reduced median import work from 777 ms to 307 ms. It does not change the archive format, add a dependency, or require a browser-specific file API.

Do not implement streaming export yet. A sequential compression prototype showed the right memory shape, but it did not produce ZIP framing. A production version would need a streaming ZIP writer and a fallback for browsers without the File System Access API.

## Measurements

All data was synthetic. No personal export was opened or uploaded, and no generated archive is committed.

### Environment and procedure

- Host date: 2026-07-18; Linux x86_64.
- Browser: Google Chrome 149.0.7827.114, driven headlessly through the repository Playwright CLI wrapper.
- User agent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36`.
- `navigator.deviceMemory`: 16 GiB.
- App: `pnpm dev --host 127.0.0.1`, then the real `parseBeRealZip` and `prepareDownloadArtifact` browser modules.
- Fixture recipe: a temporary Node script used the installed JSZip package. Each post had two 1 MiB deterministic JPEG-like entries under `Photos/`, plus valid synthetic `user.json` and `posts.json`. ZIP compression was DEFLATE level 6. The three post counts were 16, 48, and 96.
- Each case had one unrecorded warm-up followed by three recorded repetitions in a fresh page. Object URLs were revoked between repetitions. Reported values are medians. Every recorded duration was within 20% of its median.
- Duration used `performance.now()`. Long tasks used a buffered `PerformanceObserver` for `longtask`. Peak JS heap polled Chrome DevTools `Performance.getMetrics` every 5 ms. Peak process memory polled `/proc` through `ps` and reports the largest renderer RSS for the isolated Playwright profile. Blob data is external to the JS heap, so renderer RSS is the deciding memory signal.
- Reproduction: generate the fixtures in `/tmp`, start the app, open it with `playwright_cli.sh -s=memory open http://127.0.0.1:<port>`, route `/bench.zip` to each fixture, and invoke the real browser module with a synthetic `File`. Run a warm-up, then repeat three times while polling the DevTools metrics and renderer RSS. The complete-export case imports the middle fixture first and calls `prepareDownloadArtifact(posts, media, "complete", "bench")`.

### Baseline

| Case | Compressed | Expanded | Entries | Median duration | Longest main task | Peak JS heap | Peak renderer RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Import small | 150,350 B | 33,559,625 B | 34 | 519 ms | 60 ms | 9.6 MiB | 336 MiB |
| Import middle | 450,079 B | 100,678,953 B | 98 | 723 ms | 0 ms | 9.5 MiB | 491 MiB |
| Import large | 899,665 B | 201,357,945 B | 194 | 1,485 ms | 0 ms | 9.4 MiB | 443 MiB |
| Complete export of middle import | 450,079 B input / 100,755,314 B output | 100,678,953 B input | 98 input | 3,925 ms | 126 ms | 17.9 MiB | 804 MiB |

Renderer RSS is allocator-sensitive and did not increase monotonically between the middle and large import, while duration did. The low JS-heap figures confirm that ArrayBuffers and Blob storage dominate outside V8's reported heap. The complete export is the clearest pressure point because it retains imported blobs while assembling another archive.

### Candidate prototypes

Both prototypes existed only in Playwright evaluation code and `/tmp`.

| Candidate on middle workload | Median duration | Peak renderer RSS | Reduction from corresponding baseline | Evidence and compatibility |
| --- | ---: | ---: | ---: | --- |
| Lazy per-path inflation, eight-URL LRU | 307 ms | 285 MiB | 42% versus eager import | Uses current JSZip and Blob URLs; works wherever the current app works. Production blast radius is the media lookup lifecycle and views that assume every URL already exists. |
| Sequential `CompressionStream` chunks to a discard sink | 1,255 ms | 391 MiB | 51% versus complete export | `CompressionStream` and `showSaveFilePicker` were present in measured Chrome. The prototype compressed all 96 media entries without accumulating output, but did not emit ZIP framing. Firefox/Safari file-picker support and download fallback remain concerns; a streaming ZIP library or ZIP writer would be required. |

The lazy candidate passes the required 30% peak reduction on the middle import with less compatibility and dependency risk. The streaming candidate proves that bounded output is viable, but not that a portable downloadable ZIP is ready.

## Rejected alternatives

- **Keep eager inflation and only lower hard limits:** rejected as the sole fix. It avoids crashes by excluding users while the 42% reduction is available without a new dependency.
- **Adopt the native File System Access API now:** rejected because support is not portable and saving requires user activation. It can be an enhancement, not the only export path.
- **Add a streaming ZIP library now:** rejected until lazy import lands and complete-export memory is remeasured. It changes the download pipeline and generated artifact compatibility.
- **Hand-roll ZIP framing around `CompressionStream`:** rejected because ZIP metadata, ZIP64, CRCs, filenames, and cancellation make this larger and riskier than a maintained writer.
- **Raise the existing 500 MiB compressed or 2 GiB expanded hard limits:** rejected. The measured browser reached hundreds of MiB of renderer RSS at only about 200 MiB expanded.

## Next implementation

1. Introduce an internal media resolver that owns the loaded JSZip, inflates by normalized path, and caches at most eight object URLs. Keep the current eager path behind a single reversible switch during rollout. Acceptance: the middle fixture must stay at least 30% below the 491 MiB eager peak, all archive tests stay green, and median import-to-first-view must not regress by more than 20%. Roll back by switching the resolver to eager hydration and revoking its cache.
2. Convert one read-only surface at a time, starting with Overview and then Posts/Memories. Acceptance: missing media remains a visible placeholder, eviction revokes URLs, and reset leaves no live URLs. Roll back each surface to the eager media map independently.
3. After all views use the resolver, repeat these three imports and the complete export on Chrome plus one Firefox run. Keep 200 MiB expanded/200 entries as the published measured envelope until the large case is below 512 MiB renderer RSS on both browsers.
4. Only if complete export remains above 512 MiB renderer RSS, prototype a maintained streaming ZIP writer with a `WritableStream` sink and File System Access when available, plus the current Blob download fallback. Acceptance: the middle complete export must remain byte-valid, pass artifact tests, reduce the 804 MiB peak by at least 30%, and preserve filenames/metadata. Roll back to `prepareDownloadArtifact` without changing import behavior.
