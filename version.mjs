// Brute force mechanism to setting version numbers until we split the monorepo

import { spawnSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'


const replaceVersionNumber = (fileName, version, ...replacements) => {
    let data = readFileSync(fileName).toString()
    for (const search of replacements) {
        let i = search.indexOf('__VERSION__')
        if (i == -1) {
            throw new Error(`"${search}" does not contain "__VERSION__"`)
        }
        let s = new RegExp(
            search.replace('__VERSION__', '\\d+.\\d+.\\d+').replace('.', '\\.').replace('^', '\\^').replace(':', '\\:')
        )
        let j = s.exec(data)
        if (!j) {
            throw new Error(`"${s} not found in ${fileName}`)
        }

        let r = search.replace('__VERSION__', version)
        data = data.replace(s, r)
    }

    console.log(`Writing updates to ${fileName}`)
    writeFileSync(fileName, data)
}


try {
    if (process.argv.length !== 3) {
        throw new Error('Requries an argument specifying version number')
    }
    let version = process.argv[2]
    console.log(`Set version to ${version} `)

    replaceVersionNumber('apicize/cli/Cargo.toml', version, '\nversion = "__VERSION__"\n', '\napicize_lib = { path = "../lib-rust", version = "^__VERSION__" }\n')
    replaceVersionNumber('apicize/lib-rust/Cargo.toml', version, '\nversion = "__VERSION__"\n')
    replaceVersionNumber('apicize/lib-typescript/package.json', version, '"version": "__VERSION__",\n')
    replaceVersionNumber('apicize/toolkit/package.json', version, '"version": "__VERSION__",\n', '"@apicize/lib-typescript": "^__VERSION__",\n')
    replaceVersionNumber('app/src-tauri/Cargo.toml', version, '\nversion = "__VERSION__"\n', '\napicize_lib = { version = "__VERSION__", path = "../../apicize/lib-rust" }\n')
    replaceVersionNumber('app/src-tauri/tauri.conf.json', version, '"version": "__VERSION__",\n')
    replaceVersionNumber('app/package.json', version, '"version": "__VERSION__",\n', '"@apicize/toolkit": "^__VERSION__",\n')

    console.log('Running yarn')
    spawnSync('yarn')

    process.exit(0)
} catch (e) {
    console.error(`${e} `)
    process.exit(-1);
}