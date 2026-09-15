# The DXKB web application

## System Requirements

Node.js is required to run the application. The latest LTS or Current stable build will both work. Make sure `NPM` is also installed alongside `Node.js` (Should be by default).

[Node.js Downloads](https://nodejs.org/en/download/) for Windows, MacOS, and Linux

If using **MacOS** it may be easier to install via [Homebrew](https://brew.sh/)
```
brew install node
```

## First Steps
Clone or Fork & Clone the [BV-BRC-Web](https://github.com/BV-BRC/BV-BRC-Web) repository to your local machine.

### Git
```
git clone https://github.com/BV-BRC/BV-BRC-Web.git
cd BV-BRC-Web
npm install
```

**Or**

### GitHub CLI:
```
gh repo clone BV-BRC/BV-BRC-Web
cd BV-BRC-Web
npm install
```

**Note:** After you run `npm install` you must run to fetch all modules in the node_modules directory.

```
git submodule update --init
```

Make sure you must `npm install` in the BV-BRC-Web directory first though!

## Running the web application
Run from inside the directory:
```
npm start
```

Your local dev environment will run on ```http://localhost:3000/``` and you can access it here.

There is a file called `p3-web.conf` that is used for initial setup and config. The `p3-web.conf.sample` file that is included comes blank.

Please: `cp p3-web.conf.sample p3-web.conf` and edit as necessary. You may need to get the correct info from a team member so feel reach to reach out.

Note: if any configuration changes are made (i.e., changes to `./p3-web.conf`), then `./bin/p3-web` must be restarted for the effects to take place within the local dev application.

## Service info dialogs & documentation (`docsServiceURL`)

Each service page has an **ⓘ (info)** icon in its title that opens an **Overview** dialog
describing the service. **This content does not live in this repo.** At runtime the app fetches
an HTML page from the separate **[dxkb-docs](https://github.com/CEPI-dxkb/dxkb-docs)** site
(`git clone` it alongside this repo) and extracts the matching section.

- The fetch logic is in `public/js/p3/widget/app/AppBase.js` → `gethelp()`.
- It requests `docsServiceURL` + the widget's `applicationHelp` path, e.g.
  `https://www.dxkb.org/docs/quick_references/services/genome_annotation_service.html`,
  then injects the element whose `id` matches the info button's `name` (e.g. `overview`).
- `docsServiceURL` defaults to `https://www.dxkb.org/docs/` (see `config.js`, `config-dev.js`,
  `config-test.js`; override in `p3-web.conf`).
- If the docs site is unreachable, the dialog shows a graceful
  "Help information is currently unavailable" message instead of a dead icon.

### Seeing the info dialogs work on your machine (local docs setup)

**`https://www.dxkb.org/docs/` is not published yet.** Until it is, the ⓘ icons show the
"Help information is currently unavailable" fallback unless you build the docs locally, so
**anyone reviewing or QA-ing these dialogs needs to do this once.** `public/docs/` is
git-ignored, so it does not arrive with a `git clone` or a branch checkout.

DXKB documentation is maintained separately from BV-BRC's, in the dxkb-docs repo. The content
overlaps heavily today, but the DXKB-only services have no BV-BRC page at all -- FrustraMPNN,
StabiliNNator, StabilityPrediction, StructureSequencePrediction, Genomad,
MobileElementDetection and ComparativePathway all 404 on `bv-brc.org/docs/`, while the
dxkb-docs build covers every path the service widgets request. That is why `docsServiceURL`
points at dxkb.org rather than borrowing BV-BRC's site.

Requires Python 3.12+ (pip resolves Sphinx to 9.x, which floors there — older interpreters fail
at `pip install`) and the `enchant` native library (`sphinxcontrib-spelling` depends on it;
`apt install libenchant-2-2` / `brew install enchant` if the install complains).

```bash
# 1. Clone the docs repo (alongside this one; it is a SEPARATE repo, not a submodule)
git clone https://github.com/CEPI-dxkb/dxkb-docs.git
cd dxkb-docs

# 2. Create the virtualenv at the REPO ROOT (requirements.txt lives here, not in docroot/)
python3 -m venv venv && source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Build
cd docroot
make html            # or: python -m sphinx -b html . _build/html

# 4. Copy the build into this app's static folder. mkdir first -- the folder is
#    git-ignored, so it does NOT exist in a fresh clone and `cp` would fail.
mkdir -p /path/to/dxkb-web/public/docs
cp -r _build/html/* /path/to/dxkb-web/public/docs/

# 5. In dxkb-web/p3-web.conf (git-ignored, local only) add:
#      "docsServiceURL": "/public/docs/"
#    (trailing slash optional -- AppBase normalizes it)
#    then start the app:  npm start
```

Then open a service page and click the ⓘ icon — e.g.
<http://localhost:3000/app/FrustraMPNN>.

**`make html` prints ~250 warnings** about missing images and unresolved `/tutorial/...`
cross-references. That is expected: this repo carries the page text but not the screenshots.
The dialogs only use the text, so the warnings are harmless. What matters is the final line
reading `build succeeded`.

Two things that commonly look like "the docs didn't work":

- **You must be logged in.** Most service widgets set `requireAuth: true`; when logged out the
  entire form template is swapped for the login page, which has no ⓘ icons at all.
- **Browser caching.** `/public/` is served with a 1-year cache. `gethelp()` fetches the doc
  over XHR *after* page load, and a hard refresh does not revalidate sub-resource requests, so a
  stale copy can survive both a hard refresh and a server restart. In dev, `app.js` now serves
  `/public/docs/` with `Cache-Control: no-store` to prevent this; if you still see stale content
  from before that fix, load the doc URL directly once and hard-refresh it, or tick
  "Disable cache" in DevTools.

To verify the wiring without clicking through the UI, check that the ids the info buttons look
up are present in the built page:

```bash
curl -s http://localhost:3000/public/docs/quick_references/services/frustraMPNN_service.html \
  | grep -o 'id="overview"\|id="pdb-selection"\|id="parameters"'
```

The number of info buttons varies per service -- FrustraMPNN has three (`overview`,
`pdb-selection`, `parameters`), ComprehensiveGenomeAnalysis has seven, BLAST has one. To list the
ones a given form expects, read the `name` attributes off its template:

```bash
grep -o 'name="[^"]*" class="[^"]*infobutton' \
  public/js/p3/widget/app/templates/FrustraMPNN.html
```

A button whose `name` has no matching element `id` in the fetched doc renders "Help text missing".
The ids come from the Markdown headings via MyST's `myst_heading_anchors`, so heading text and
button name must slugify to the same string (`## PDB Selection` → `pdb-selection`).

**Trailing slash on `docsServiceURL`.** Either form works. `AppBase.postMixInProperties()`
normalizes the value (`this.docsServiceURL = PathJoin(this.docsServiceURL) + '/'`), so
`/public/docs` and `/public/docs/` behave identically.

This was not always true. The templates build tutorial links by raw concatenation
(`${docsServiceURL}${tutorialLink}`), so before that normalization a missing slash produced
`/public/docstutorial/...` and 404'd every tutorial link -- while the ⓘ dialogs kept working,
since `gethelp()` joins via `PathJoin`. If you are ever on a build without the normalization,
that split (broken tutorial links, working dialogs) is the signature.

> `public/docs/` and the `docsServiceURL` override are **local test scaffolding only** — both are
> git-ignored and must never be committed. Production keeps `docsServiceURL` pointing at
> `https://www.dxkb.org/docs/`, which the dxkb-docs repo publishes to.

## Contributing
If you'd like to contribute please follow our [CONTRIBUTING.md]() guide for more information (coming soon).
