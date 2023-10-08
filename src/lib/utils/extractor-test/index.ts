import type { ParsedFile } from '../Extractor'

import { readFile, writeFile, unlink } from 'node:fs/promises'
import { entries, values } from '../object'
import { Extractor } from '../Extractor'
import { l, n, r, start } from '../l'
import { debrief } from '../debrief'
import { globbySync } from 'globby'

const lib = 'src/lib/'
const folders = [
	//...
	'components',
	// 'actions',
	// 'stores',
	// 'theme',
	// 'utils',
] as const

interface Category {
	category: string
	folderPath: string
	ts: string[]
	svelte: string[]
}

interface ParsedCategory {
	category: string
	folderPath: string
	ts: ParsedFile[]
	svelte: ParsedFile[]
}

type CategoryMap = Record<(typeof folders)[number], Category>

await main()
l(r('fin'))

async function main() {
	const end = start('main')
	clear()

	const categories = buildCategoryMap()
	l('Extracting:')
	l(Object.keys(categories))

	await transformSvelte(categories)
	l('categories:')
	l(debrief(categories, { depth: 2, siblings: 4 }))

	const comments = getComments(categories)
	l('comments')
	l(debrief(comments, { depth: 3, siblings: 4 }))

	await writeComments(comments)

	await cleanup()

	end()
}

async function writeComments(comments: ParsedCategory[]) {
	const end = start('writeComments')

	for (const comment of comments) {
		for (const { file, comments } of [comment.ts, comment.svelte].flat()) {
			const out = file.replace(/(\.svelte)?\.ts/, '.json')
			const content = JSON.stringify(comments, null, 2)
			l('writing file: ' + out)
			// await writeFile('src/lib/' + out, content)
		}
	}

	end()
}

function buildCategoryMap() {
	const end = start('buildCategoryMap')

	const categories = folders.reduce((acc, folder) => {
		acc[folder] = {
			category: folder,
			folderPath: lib + folder,
			ts: globbySync(lib + folder, {
				expandDirectories: {
					files: ['*.ts'],
				},
			}).filter((p) => !p.endsWith('.svelte.ts')),
			svelte: globbySync(lib + folder, {
				expandDirectories: {
					extensions: ['svelte'],
				},
			}),
		}
		return acc
	}, {} as CategoryMap)

	end()
	return categories
}

/**
 * Extracts and parses all comments from a given {@link CategoryMap}.
 * @param map {@link CategoryMap}
 */
function getComments(map: CategoryMap, verbose = true) {
	const end = start('getComments')

	const comments = values(map).map((category) => {
		return {
			...category,
			ts: category.ts.length ? Extractor.scanFiles(category.ts, true) : [],
			svelte: Extractor.scanFiles(category.svelte, true),
		} as ParsedCategory
	})

	if (verbose) {
		for (const comment of comments) {
			for (const { comments } of [comment.ts, comment.svelte].flat()) {
				for (const comment of comments) {
					Extractor.logComment(comment)
				}
			}
		}
	}

	end()
	return comments
}

/**
 * Transforms all `*.svelte` files to `*.svelte.ts` files using `svelte2tsx`.
 * @param map {@link CategoryMap}
 */
async function transformSvelte(map: CategoryMap) {
	const end = start('transformSvelte')

	for (const [name, category] of entries(map)) {
		for (const filepath of category.svelte) {
			const buffer = await readFile(filepath, {
				encoding: 'utf-8',
			})

			const filename = filepath.split('/').pop() as string

			const compiled = Extractor.compileSvelte(buffer, filename)

			await writeFile(filepath + '.ts', compiled.code)

			map[name].svelte[map[name].svelte.indexOf(filepath)] += '.ts'
		}
	}

	end()
}

/** Removes all generated `*.svelte.ts` files after the extraction process. */
async function cleanup() {
	const end = start('cleanup')

	const files = globbySync('src/lib/**/*.svelte.ts')
	for (const file of files) {
		await unlink(file)
	}

	end()
}

function clear() {
	console.clear()
	n(2)
	console.log('-'.repeat(70))
	n()
}
