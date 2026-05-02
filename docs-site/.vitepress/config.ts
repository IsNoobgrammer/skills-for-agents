import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Skills for Agents',
  description: 'Composable, domain-specific instruction sets for AI agents',
  base: '/skills-for-agents/',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Skills', link: '/skills/' },
      { text: 'Reference', link: '/reference/composability' },
      { text: 'GitHub', link: 'https://github.com/IsNoobgrammer/skills-for-agents' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'SIP Framework', link: '/guide/sip-framework' },
            { text: 'Creating Skills', link: '/guide/creating-skills' }
          ]
        }
      ],
      
      '/skills/': [
        {
          text: 'Voice',
          items: [
            { text: 'Blogger', link: '/skills/blogger' }
          ]
        },
        {
          text: 'Density',
          items: [
            { text: 'Caveman', link: '/skills/caveman' },
            { text: 'Compress', link: '/skills/compress' }
          ]
        },
        {
          text: 'Craft',
          items: [
            { text: 'Painter', link: '/skills/painter' },
            { text: 'Harden', link: '/skills/harden' }
          ]
        },
        {
          text: 'Process',
          items: [
            { text: 'Memory', link: '/skills/memory' },
            { text: 'ML Engine', link: '/skills/ml-engine' },
            { text: 'Postmortem', link: '/skills/postmortem' },
            { text: 'Refactor', link: '/skills/refactor' },
            { text: 'Skill Creator', link: '/skills/skill-creator' }
          ]
        },
        {
          text: 'Content',
          items: [
            { text: 'Documenter', link: '/skills/documenter' },
            { text: 'Researcher', link: '/skills/researcher' },
            { text: 'Learn', link: '/skills/learn' }
          ]
        }
      ],
      
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Composability', link: '/reference/composability' },
            { text: 'Best Practices', link: '/reference/best-practices' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/IsNoobgrammer/skills-for-agents' }
    ],
    
    search: {
      provider: 'local'
    },
    
    editLink: {
      pattern: 'https://github.com/IsNoobgrammer/skills-for-agents/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub'
    },
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Shaurya Sharthak'
    }
  },
  
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/skills-for-agents/logo.svg' }],
    ['meta', { name: 'theme-color', content: 'oklch(60% 0.15 260)' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Skills for Agents' }],
    ['meta', { name: 'og:description', content: 'Composable, domain-specific instruction sets for AI agents' }]
  ]
})
