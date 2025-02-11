import { Box, IconButton, Link, LinkProps, SvgIcon, SxProps, Typography, TypographyProps, TypographyPropsVariantOverrides } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AltRouteIcon from '@mui/icons-material/AltRoute'
import { createElement, Fragment, HTMLAttributes, useRef, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { visit } from 'unist-util-visit';
import SettingsIcon from '@mui/icons-material/Settings';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ScienceIcon from '@mui/icons-material/Science';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { logo } from './logo';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeReact from 'rehype-react'
import remarkGfm from 'remark-gfm'
import { LeafDirective } from 'mdast-util-directive'
import { Element } from 'hast';
import { Variant } from '@mui/material/styles/createTypography';
import { OverridableStringUnion } from '@mui/types'
import { unified } from 'unified';
import remarkDirective from 'remark-directive';
import { ExtraProps } from 'hast-util-to-jsx-runtime';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../contexts/feedback.context';
import { useFileOperations } from '../contexts/file-operations.context';
import AuthIcon from '../icons/auth-icon';
import ScenarioIcon from '../icons/scenario-icon';
import CertificateIcon from '../icons/certificate-icon';
import ProxyIcon from '../icons/proxy-icon';
import RequestIcon from '../icons/request-icon';
import DefaultsIcon from '../icons/defaults-icon';
import PublicIcon from '../icons/public-icon';
import PrivateIcon from '../icons/private-icon';
import VaultIcon from '../icons/vault-icon';
import ApicizeIcon from '../icons/apicize-icon';
import FolderIcon from '../icons/folder-icon';
import { Parent } from 'unist';

// Register `hName`, `hProperties` types, used when turning markdown to HTML:
/// <reference types="mdast-util-to-hast" />
// Register directive nodes in mdast:
/// <reference types="mdast-util-directive" />

export const HelpPanel = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const fileOps = useFileOperations()
    const feedback = useFeedback()

    let name = workspace.appName
    let version = workspace.appVersion

    let [content, setContent] = useState(createElement(Fragment));
    let activeTopic = useRef('')

    // reaction(
    //     () => ({ topic: workspace.helpTopic, visible: workspace.helpVisible }),
    //     async ({ topic, visible }) => {
    //         if (!visible) return

    //         try {
    //             showHome = topic !== 'home'
    //             showBack = workspace.helpHistory.length > 1

    //             if (topic === lastTopic) return

    //             const helpText = await fileOps.retrieveHelpTopic(topic ?? 'home')
    //             if (helpText.length > 0) {
    //                 const r = await unified()
    //                     .use(remarkParse)
    //                     .use(remarkGfm)
    //                     .use(remarkDirective)
    //                     .use(remarkApicizeDirectives)
    //                     .use(remarkRehype)
    //                     // @ts-expect-error
    //                     .use(rehypeReact, {
    //                         Fragment,
    //                         jsx,
    //                         jsxs,
    //                         passNode: true,
    //                         components: {
    //                             logo,
    //                             icon: rehypeTransformIcon,
    //                             toolbar: rehypeTransformToolbar,
    //                             h1: rehypeTransformHeader,
    //                             h2: rehypeTransformHeader,
    //                             h3: rehypeTransformHeader,
    //                             h4: rehypeTransformHeader,
    //                             h5: rehypeTransformHeader,
    //                             h6: rehypeTransformHeader,
    //                             a: rehypeTranformAnchor,
    //                             p: rehypeTransformParagraph,
    //                         }
    //                     })
    //                     .process(helpText)
    //                 setContent(r.result)
    //                 setLastTopic(topic)
    //             }
    //         } catch (e) {
    //             feedback.toast(`Unable to display topic ${topic} - ${e}`, ToastSeverity.Error)
    //         }
    //     }
    // )

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
            } else if (node.name === 'toolbar-left') {
                const data: any = node.data || (node.data = {})
                data.hName = 'toolbarLeft'
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

        return (tree: Parent) => {
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
                return <SvgIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }}><RequestIcon /></SvgIcon>
            case 'group':
                return <SvgIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }}><FolderIcon /></SvgIcon>
            case 'info':
                return <DisplaySettingsIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'query':
                return <ViewListIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'headers':
                return <ViewListOutlinedIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'body':
                return <ArticleOutlinedIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'parameters':
                return <AltRouteIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'test':
                return <ScienceIcon className='help-icon' color='request' sx={{ marginRight: '0.5em' }} />
            case 'authorization':
                return <SvgIcon className='help-icon' color='authorization' sx={{ marginRight: '0.5em' }}><AuthIcon /></SvgIcon>
            case 'scenario':
                return <SvgIcon className='help-icon' color='scenario' sx={{ marginRight: '0.5em' }}><ScenarioIcon /></SvgIcon>
            case 'certificate':
                return <SvgIcon className='help-icon' color='certificate' sx={{ marginRight: '0.5em' }}><CertificateIcon /></SvgIcon>
            case 'proxy':
                return <SvgIcon className='help-icon' color='proxy' sx={{ marginRight: '0.5em' }}><ProxyIcon /></SvgIcon>
            case 'defaults':
                return <SvgIcon className='help-icon' color='defaults' sx={{ marginRight: '0.5em' }}><DefaultsIcon /></SvgIcon>
            case 'settings':
                return <SettingsIcon className='help-icon' />
            case 'display':
                return <DisplaySettingsIcon className='help-icon' />
            case 'public':
                return <SvgIcon className='help-icon' color='public' sx={{ marginRight: '0.5em' }}><PublicIcon /></SvgIcon>
            case 'private':
                return <SvgIcon className='help-icon' color='private' sx={{ marginRight: '0.5em' }}><PrivateIcon /></SvgIcon>
            case 'vault':
                return <SvgIcon className='help-icon' color='vault' sx={{ marginRight: '0.5em' }}><VaultIcon /></SvgIcon>
            case 'apicize':
                return <SvgIcon className='help-icon' sx={{ marginRight: '0.5em' }}><ApicizeIcon /></SvgIcon>
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

    const rehypeTransformToolbar = (attrs: ExtraProps): React.ReactNode => renderToolbar()

    const rehypeTransformToolbarLeft = (attrs: ExtraProps): React.ReactNode => renderToolbar('0')

    const renderToolbar = (marginLeft = '2em') => {
        return (
            <Box className='help-toolbar' marginLeft={marginLeft}>
                {
                    workspace.allowHelpHome
                        ? <IconButton color='primary' size='medium' aria-label='Home' title='Home' onClick={() => workspace.showHelp('home')}><HomeIcon fontSize='inherit' /></IconButton>
                        : <></>
                }
                {
                    workspace.allowHelpBack
                        ? <IconButton color='primary' size='medium' aria-label='Back' title='Back' onClick={() => workspace.helpBack()}><ArrowBackIcon fontSize='inherit' /></IconButton>
                        : <></>
                }
                {
                    workspace.allowHelpAbout
                        ? <IconButton color='primary' size='medium' aria-label='About' title='About' onClick={() => workspace.showHelp('about')}><QuestionMarkIcon fontSize='inherit' /></IconButton>
                        : <></>
                }
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
            </Box>
        )
    }

    // Make sure we do not go through overhead of re-rendering the existing topic
    if (workspace.helpTopic !== activeTopic.current) {
        activeTopic.current = workspace.helpTopic ?? '';

        (async () => {
            try {
                const contents = await fileOps.retrieveHelpTopic(activeTopic.current)
                const r = await unified()
                    .use(remarkParse)
                    .use(remarkGfm)
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
                            toolbarLeft: rehypeTransformToolbarLeft,
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
                    .process(contents)
                setContent(r.result)
            } catch (e) {
                feedback.toast(`Unable to render help topic "${activeTopic.current} - ${e}}`, ToastSeverity.Error)
            }
        })();
    }

    return <Box className='help' sx={props.sx}>
        <Box className='help-text'>
            {content}
        </Box>
    </Box>
})
