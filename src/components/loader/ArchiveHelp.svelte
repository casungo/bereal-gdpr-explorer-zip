<section
  class="mx-auto mt-12 max-w-3xl space-y-8 leading-relaxed"
  aria-label="About the BeReal archive viewer"
>
  <div>
    <h2 class="text-2xl font-semibold">Save photos from your BeReal archive</h2>
    <p class="mt-3">
      After importing, select <strong>Download complete archive</strong> in the overview.
      Choose separate camera images, merged photos, or both. Separate images keep
      their original format; merged photos are JPEGs. ZIP downloads include timestamps
      and locations when they are present in the export.
    </p>
    <p class="mt-3">
      Want to see the result first? <strong>Explore demo data</strong> opens a synthetic
      archive with sample posts, memories and conversations. Its images are illustrations,
      not private BeReal photos.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold">Supported files and limits</h2>
    <p class="mt-3">
      Select the original BeReal ZIP containing JSON records and media. A
      standalone JSON file or a ZIP of unrelated photos is not a supported
      export. Add the optional <code>.json.gz</code> file only if BeReal supplied
      analytics data.
    </p>
    <ul class="mt-3 list-disc space-y-1 pl-6">
      <li>ZIP up to 500 MiB, with at most 20,000 entries.</li>
      <li>Optional analytics GZ up to 100 MiB compressed.</li>
      <li>Expanded ZIP up to 2 GiB, each entry up to 512 MiB.</li>
      <li>Expanded analytics up to 512 MiB.</li>
    </ul>
    <p class="mt-3">
      Large archives also depend on your browser's available memory. The import
      report lists missing, malformed or unsupported sections. The viewer can
      only display what BeReal included and it cannot recover deleted or missing
      photos.
    </p>
  </div>
  <div>
    <h2 class="text-2xl font-semibold">Questions before opening your export</h2>
    <div class="mt-4 divide-y divide-base-300">
      <details class="py-4">
        <summary class="cursor-pointer font-semibold"
          >How do I get my BeReal export?</summary
        >
        <p class="mt-3">
          Ask BeReal for a downloadable copy of your account data. Follow our
          <a class="link link-primary" href="/how-to-export-bereal/"
            >export request guide</a
          >
          for the official contact and an example request. This viewer does not log
          into BeReal or request data on your behalf.
        </p>
      </details>
      <details class="py-4">
        <summary class="cursor-pointer font-semibold"
          >Is the viewer free, and do I need an account?</summary
        >
        <p class="mt-3">
          It is free. No viewer account, subscription or BeReal login is
          required to open a supported export.
        </p>
      </details>
      <details class="py-4">
        <summary class="cursor-pointer font-semibold"
          >Are my files uploaded or kept after I close the tab?</summary
        >
        <p class="mt-3">
          Your browser processes the selected files locally. The app does not
          upload them or collect product analytics. Imported records stay in
          memory and clear on refresh. The offline cache keeps the app shell,
          not your archive. Downloads you save remain on your device.
        </p>
      </details>
      <details class="py-4">
        <summary class="cursor-pointer font-semibold"
          >Why are some memories or messages missing?</summary
        >
        <p class="mt-3">
          Exports can differ. Review the import report to distinguish missing
          data from skipped or unsupported records. Keep the original ZIP. If
          you report a problem on GitHub, share your browser version and the
          error, not your archive, messages or personal details.
        </p>
      </details>
      <details class="py-4">
        <summary class="cursor-pointer font-semibold"
          >Can I use it offline?</summary
        >
        <p class="mt-3">
          After loading the app online, a supported browser can cache the app
          shell for offline use. Select your export again when reopening it.
          Opening and downloading require JavaScript and a modern browser.
        </p>
      </details>
    </div>
  </div>
</section>
