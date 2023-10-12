import { load_config } from './package/config'
import { build } from './package/index'

const config = await load_config()

console.log(config)

await build({
	input: 'src',
	output: '.',
	cwd: process.cwd(),
	types: true,
	config: config,
})

// await extract(true)
