import { Box, IconButton, Link, LinkProps, Typography, TypographyProps, TypographyPropsVariantOverrides } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { createElement, Fragment, HTMLAttributes, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { visit } from 'unist-util-visit';
import { Node as DastNode } from 'mdast';
import SendIcon from '@mui/icons-material/Send';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ScienceIcon from '@mui/icons-material/Science';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import { logo } from './logo';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeReact from 'rehype-react'
import { LeafDirective } from 'mdast-util-directive'
import { Element } from 'hast';
import { Variant } from '@mui/material/styles/createTypography';
import { OverridableStringUnion } from '@mui/types'
import { unified } from 'unified';
import remarkDirective from 'remark-directive';
import { ExtraProps } from 'hast-util-to-jsx-runtime';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { useWorkspace } from '../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../contexts/feedback.context';
import { useFileOperations } from '../contexts/file-operations.context';

// Register `hName`, `hProperties` types, used when turning markdown to HTML:
/// <reference types="mdast-util-to-hast" />
// Register directive nodes in mdast:
/// <reference types="mdast-util-directive" />

export const HelpPanel = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const fileOps = useFileOperations()

    let name = workspace.appName
    let version = workspace.appVersion

    let [lastTopic, setLastTopic] = useState('')
    let [content, setContent] = useState(createElement(Fragment))
    // let [showHome, setShowHome] = useState(false)
    // let [showBack, setShowBack] = useState(false)

    let showHome = false
    let showBack = false

    reaction(
        () => ({ topic: workspace.helpTopic, visible: workspace.helpVisible }),
        async ({ topic, visible }) => {
            if (!visible) return

            try {
                showHome = topic !== 'home'
                showBack = workspace.helpHistory.length > 1

                if (topic === lastTopic) return

                const helpText = await fileOps.retrieveHelpTopic(topic ?? 'home')
                if (helpText.length > 0) {
                    const r = await unified()
                        .use(remarkParse)
                        .use(remarkDirective)
                        .use(remarkApicizeDirectives)
                        .use(remarkRehype)
                        // @ts-expect-error
                        .use(rehypeReact, {
                            Fragment,
                            jsx,
                            jsxs,
                            passNode: true,
                            components: {
                                logo,
                                icon: rehypeTransformIcon,
                                toolbar: rehypeTransformToolbar,
                                h1: rehypeTransformHeader,
                                h2: rehypeTransformHeader,
                                h3: rehypeTransformHeader,
                                h4: rehypeTransformHeader,
                                h5: rehypeTransformHeader,
                                h6: rehypeTransformHeader,
                                a: rehypeTranformAnchor,
                                p: rehypeTransformParagraph,
                            }
                        })
                        .process(helpText)
                    setContent(r.result)
                    setLastTopic(topic)
                }
                feedback.toast(`Retrieved help topic ${topic}`, ToastSeverity.Info)
            } catch (e) {
                feedback.toast(`Unable to display topic ${topic} - ${e}`, ToastSeverity.Error)
            }
        }
    )

    function remarkApicizeDirectives() {
        const handleLogo = (node: LeafDirective) => {
            if (node.name === 'logo') {
                const data: any = node.data || (node.data = {})
                data.hName = 'logo'
                return true
            } else {
                return false
            }
        }

        const handleToolbar = (node: LeafDirective) => {
            if (node.name === 'toolbar') {
                const data: any = node.data || (node.data = {})
                data.hName = 'toolbar'
                return true
            } else {
                return false
            }
        }

        const handleInfo = (node: LeafDirective) => {
            if (node.name !== 'info' || node.children.length === 0) return false
            const child = node.children[0]
            if (child.type !== 'text') return false

            const data: any = node.data || (node.data = {})

            let replaceWith
            switch (child.value) {
                case 'name':
                    replaceWith = name
                    break
                case 'version':
                    replaceWith = version
                    break
                default:
                    // if not an information item that we know about, ignore it
                    return false
            }
            data.hName = 'span'
            data.hChildren = [
                {
                    type: 'text',
                    value: replaceWith
                }
            ]
            return true
        }

        const handleIcon = (node: LeafDirective) => {
            if (node.name !== 'icon' || node.children.length === 0) return false
            const child = node.children[0]
            if (child.type !== 'text') return false

            const data: any = node.data || (node.data = {})

            data.hName = 'icon'
            data.hProperties = { name: child.value }
            data.hChildren = []
            return true
        }

        return (tree: DastNode) => {
            visit(tree, 'leafDirective', function (node: LeafDirective) {
                handleLogo(node) || handleToolbar(node)

            })
            visit(tree, 'textDirective', function (node: LeafDirective) {
                handleLogo(node) || handleToolbar(node) || handleInfo(node) || handleIcon(node)
            })
        }
    }

    const rehypeTransformHeader = (attrs: JSX.IntrinsicElements['h1'] & TypographyProps & ExtraProps): React.ReactNode => {
        let id
        if (attrs.children && attrs.node) {
            if (Array.isArray(attrs.children)) {
                const first = attrs.children[0]
                if (first) id = first.toString()
            } else {
                id = attrs.children.toString()
            }
        }
        if (id) {
            id = id.trim().toLowerCase().replace(/[^\s\w]/g, '').replace(/\s/g, '-')
            const name = (attrs.node as Element).tagName as OverridableStringUnion<Variant | 'inherit', TypographyPropsVariantOverrides>
            return <Typography id={id} component='div' variant={name} {...attrs} />
        } else {
            return <></>
        }
    }

    const rehypeTransformIcon = (attrs: HTMLAttributes<any>) => {
        const attrsWithNode = attrs as any
        const name = (attrsWithNode.node as any).properties.name
        switch (name) {
            case 'request':
                return <SendIcon className='help-icon' />
            case 'info':
                return <DisplaySettingsIcon className='help-icon' />
            case 'query':
                return <ViewListIcon className='help-icon' />
            case 'headers':
                return <ViewListOutlinedIcon className='help-icon' />
            case 'body':
                return <ArticleOutlinedIcon className='help-icon' />
            case 'test':
                return <ScienceIcon className='help-icon' />
            case 'authorization':
                return <LockIcon className='help-icon' />
            case 'certificate':
                return <SecurityIcon className='help-icon' />
            case 'proxy':
                return <AirlineStopsIcon className='help-icon' />
            default:
                return null
        }
    }

    const rehypeTranformAnchor = (attrs: JSX.IntrinsicElements['a'] & LinkProps & ExtraProps): React.ReactNode => {
        if (attrs.href) {
            if (attrs.href.startsWith('help:')) {
                const topic = attrs.href.substring(5)
                attrs = { ...attrs, href: '#' }
                return <Link {...attrs} onClick={() => workspace.showHelp(topic)} />
            }
            else if (attrs.href.startsWith('icon:')) {
                return <DisplaySettingsIcon />
            }
        }
        return <Link {...attrs} />
    }

    const rehypeTransformParagraph = (attrs: ExtraProps): React.ReactNode => {
        return <Typography component='div' variant='body1' {...attrs} />
    }

    const rehypeTransformToolbar = (attrs: ExtraProps): React.ReactNode => {
        return (
            <Box className='help-toolbar'>
                {
                    showHome
                        ? <IconButton color='primary' size='medium' aria-label='Home' title='Home' onClick={() => workspace.showHelp('home')}><HomeIcon fontSize='inherit' /></IconButton>
                        : <></>
                }
                {
                    showBack
                        ? <IconButton color='primary' size='medium' aria-label='Back' title='Back' onClick={() => workspace.backHelp()}><ArrowBackIcon fontSize='inherit' /></IconButton>
                        : <></>
                }
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.hideHelp()}><CloseIcon fontSize='inherit' /></IconButton>
            </Box>
        )
    }

    if (workspace.helpVisible) {
        return <Box className='help'>
            <Box className='help-text'>
                {content}
            </Box>
        </Box>
    } else {
        return null
    }
})
