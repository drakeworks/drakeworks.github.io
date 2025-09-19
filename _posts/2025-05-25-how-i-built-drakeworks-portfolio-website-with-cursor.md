---
title: "How I Built the DrakeWorks Portfolio Website with Cursor: Architecture, Experience, and Lessons Learned"
date: 2025-05-25 10:00:00 +0000
tags: [development, artificial-intelligence]
featured: false
excerpt: "A deep dive into building the DrakeWorks portfolio website, how I used Cursor as an AI coding assistant, and the lessons I took away from the process."
image: /images/posts/drakeworks-portfolio-website-with-cursor.jpg
---

So I decided to rebuild my portfolio. Not just a basic "here's my resume and a contact form" kind of site, but a full portfolio, blog, and professional knowledge base. I ended up moving away from Medium as a platform and created my own blog—partly because I got tired of their algorithm deciding who sees my content, partly because of their paywalls, and partly because I wanted the flexibility and full control over design, performance, and user experience that I could only get from my own site. I wanted something that looked sharp, ran fast, and didn't feel like a cookie-cutter template.  

I also wanted to push myself with architecture. This wasn't just about having a website. It was about showing that I can build something systematic, scalable, and production-ready. Which is where Cursor came in. Spoiler: it helped a lot, but it didn't replace me. Not even close.  

---

## The Project at a Glance

The site is called **DrakeWorks**, and it runs on Jekyll. Why Jekyll? Because it's stable, plays nice with GitHub Pages, and doesn't require me to babysit a database. My stack ended up looking like this:  

- **Jekyll 4.3.2** for static site generation.  
- **SCSS** for styling, chopped into modular files so it doesn't turn into spaghetti.  
- **Vanilla JavaScript** with a few libraries like Splide.js for sliders and Simple Jekyll Search.  
- **GitHub Actions** for staging and production deployments.  
- **YAML** for structured content so I can manage projects, navigation, and case studies without touching HTML every time.  

The whole thing is designed for performance: lazy loading, responsive images, compressed assets. Basically, no unnecessary bloat.  

---

## Architecture and Deployment

I set up the repo with a **staging-to-production workflow**. Staging is my sandbox, production is the polished site. GitHub Actions handle the builds, validation, and deployment.  

Why go through all that instead of just pushing straight to main? Because if you've ever broken production with a "quick fix," you know why. Staging lets me test AI-generated code before I unleash it on the world.  

The structure itself is modular:  
- SCSS is split into variables, base, components, and utilities.  
- Content is driven by YAML so I can scale without needing a CMS.  
- Includes and layouts keep templates clean and reusable.  

This isn't hobby-project code. It's structured like something you'd see in an enterprise environment.  

---

## Using Cursor in the Build

Here's the part you probably care about: how did Cursor actually perform?  

### The good stuff
- It's great at scaffolding. I could ask it to break down my SCSS into logical modules, and it delivered.  
- YAML modeling? Cursor helped me design data structures for projects, navigation, and case studies without losing my mind.  
- GitHub Actions workflows? Cursor drafted the skeletons, and I refined them. That saved me hours.  
- It integrated JavaScript libraries quickly. Things like theme switching and lazy loading were handled in minutes instead of hours.  

### The hiccups
- Cursor can't handle massive files gracefully. It chokes.  
- Sometimes it "helped" with things I didn't ask for. Imagine asking a contractor to fix your kitchen cabinets, and they start repainting the living room.  
- Code logic still needs human eyes. Every single time. I treated Cursor like a junior dev: useful drafts, but everything needed a review.  
- Full code reviews were non-negotiable. If you just trust the AI, you're going to regret it.  

Overall? Cursor made me faster. It didn't make me smarter. That part's still on me.  

---

## A Real Cursor Success Story: The Tag Handling Problem

Here's a specific example where Cursor saved me from a frustrating debugging session. I was building the sidebar tag cloud, and I kept running into issues with multi-word tags like "product-management" and "artificial-intelligence." 

The problem was subtle: Jekyll's `slugify` filter was converting these to "productmanagement" and "artificialintelligence," but my CSS classes and JavaScript were expecting the hyphenated versions. I spent about 30 minutes manually debugging this, trying different approaches to handle the slugification consistently across the site.

Then I asked Cursor: "How do I handle Jekyll tag slugification consistently across templates and JavaScript?" 

Cursor immediately suggested a solution: create a consistent slugification approach using a custom filter that I could reuse everywhere. It showed me how to create a `_plugins` directory with a custom filter that would handle the slugification the same way every time, and then use that filter consistently in both the Liquid templates and when generating the JavaScript data.

The solution was elegant and saved me from what would have been hours of manual debugging. More importantly, it taught me a pattern I could reuse for other similar issues throughout the site.

---

## Tips for Working with Cursor

If you're going to use Cursor (or any AI assistant), here's what actually works:  

- Break tasks into small prompts. Don't ask it to build Rome in a day.  
- Review everything. Assume bugs until proven otherwise.  
- Use it for boilerplate, structure, and repetitive junk. Keep critical business logic in your own hands.  
- Documentation and configs should always be sanity-checked by you.  
- Treat it like a collaborator, not a replacement. Cursor is great for brainstorming architecture or suggesting patterns, but it's not your CTO.  
- Set up a staging workflow. You'll thank yourself later.  

---

## Code Snippets That Made This Project Shine

Based on my analysis of the codebase, here are 4 code snippets that showcase the most impressive technical achievements and cool features we implemented:

### 1. **Sophisticated Theme System with CSS Custom Properties**

The biggest challenge with theme switching was creating a system that felt smooth and professional, not just a basic light/dark toggle. I needed semantic color naming, smooth transitions, and maintainable CSS architecture that wouldn't turn into a mess as the site grew.

~~~scss
// _variables.scss - Advanced theming system
:root {
  --primary-color: #ae00ee;
  --secondary-color: #FF4E8A;
  --white: #f0f2f5;
  --background-color: var(--white);
  --text-color: var(--dark-blue);
  --gradient-color: linear-gradient(135deg, #ae00ee 0%, #8A5FD0 60%, #00E5EE 100%);
  --gradient-hover: linear-gradient(315deg, #ae00ee 0%, #8A5FD0 60%, #00E5EE 160%);
}

[dark]:root {
  --primary-color: #ae00ee;
  --background-color: var(--dark);
  --text-color: var(--gray);
  --gradient-color: linear-gradient(135deg, #8311c0 0%, #7540C4 40%, #00B3A4 100%);
  --gradient-hover: linear-gradient(315deg, #8311c0 0%, #7540C4 40%, #00B3A4 160%);
}
~~~

**Why this is cool**: This creates a complete design system with semantic color naming, smooth theme transitions, and maintainable CSS architecture. The gradient system with hover states shows attention to micro-interactions.

---

### 2. **Advanced JavaScript Theme Switching with Persistence**

The theme switching needed to be bulletproof—graceful fallbacks for users with JavaScript disabled, localStorage persistence that didn't break on private browsing, and error handling that wouldn't crash the site. This wasn't just about toggling classes; it was about creating a robust user experience.

~~~javascript
// _layouts/default.html - Smart theme management
<script>
  const defaultTheme = "dark";
  const isToggleEnabled = true;
  
  function getStoredTheme() {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return null;
    }
  }

  function setTheme(mode) {
    if (mode === "dark") {
      document.documentElement.setAttribute("dark", "");
      document.documentElement.classList.add("dark-mode");
    } else if (mode === "light") {
      document.documentElement.removeAttribute("dark");
      document.documentElement.classList.remove("dark-mode");
    }
  }

  if (isToggleEnabled) {
    const userTheme = getStoredTheme();
    if (userTheme) {
      setTheme(userTheme);
    } else {
      setTheme(defaultTheme);
    }
  }
</script>
~~~

**Why this is cool**: This implements a robust theme switching system with graceful fallbacks, error handling, and localStorage persistence. The try-catch blocks show defensive programming practices.

---

### 3. **Data-Driven Project Architecture with Rich Metadata**

I wanted to manage content without touching HTML every time I added a project. The challenge was creating a data structure that was both flexible enough to handle different project types and structured enough to enable dynamic filtering, searching, and categorization. This YAML approach lets me scale content without a CMS.

~~~yaml
# _data/projects.yml - Sophisticated content modeling
- id: drakeworks-website
  title: "DrakeWorks Portfolio Website"
  role: "Product Manager & Developer"
  date: "2025-05-27"
  featured: true
  feature_rank: 3
  summary: "Modern, data-driven portfolio website built to showcase my professional journey, share knowledge, and establish thought leadership in product management and technical development."
  metric: "Professional portfolio showcase"
  metric_icon: "fas fa-user-tie"
  image: "/images/projects/drakeworks-website.jpg"
  tags: ["web-development", "jekyll", "scss", "javascript", "portfolio", "personal-branding", "content-management"]
  business_skills: ["Personal Branding", "Content Strategy", "Technical Leadership", "User Experience Design"]
  tools: ["Jekyll", "SCSS", "JavaScript", "YAML", "GitHub Pages", "Static Site Generation", "Responsive Design"]
  links:
    github: "https://github.com/drakeworks/drakeworks.github.io"
    case_study: "/projects/case-studies/drakeworks-website.html"
~~~

**Why this is cool**: This demonstrates a sophisticated content modeling approach that separates data from presentation, enables dynamic content generation, and supports complex filtering and categorization systems.

---

### 4. **Enterprise-Grade CI/CD Pipeline with Multi-Repository Deployment**

The deployment process needed to be foolproof. I couldn't afford to break production with a "quick fix," so I built a staging-to-production workflow that validates everything before it goes live. This pipeline handles atomic deployments, file validation, and proper error handling—the kind of process you'd see in enterprise environments.

~~~yaml
# .github/workflows/deploy-to-production.yml - Advanced deployment automation
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      deploy:
        description: 'Deploy to production?'
        required: true
        default: false
        type: boolean

jobs:
  deploy:
    if: github.event.inputs.deploy == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout staging repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PRODUCTION_TOKEN }}
          repository: drakeworks/drakeworks.github.io-stage
          path: staging

      - name: Clean production repository
        run: |
          cd production
          find . -mindepth 1 -not -path './.git*' -delete

      - name: Copy source files and production workflow to production
        run: |
          rsync -av --exclude='.git' --exclude='node_modules' --exclude='_site' --exclude='.sass-cache' --exclude='.github' staging/ production/
          cp staging/.github/workflows/build-deploy-production.yml production/.github/workflows/jekyll.yml

      - name: Verify deployment files
        run: |
          cd production
          if [ ! -f "_config.yml" ]; then
            echo "❌ ERROR: _config.yml missing"
            exit 1
          fi
          echo "✅ All critical files present"
~~~

**Why this is cool**: This implements a professional-grade deployment pipeline with staging-to-production promotion, atomic deployments, file validation, and proper error handling. It demonstrates enterprise-level DevOps practices in a personal project.

---

## Final Takeaways

Here's the truth. AI-assisted development is powerful, but it's not magic. Cursor sped things up, but it didn't save me from doing the real work. If anything, it made me double down on code reviews and architecture planning because I knew I couldn't just take its output at face value.  

The real takeaway is balance. Let AI handle the boring parts, the boilerplate, the "please don't make me write this again" code. Keep the critical decisions and complex logic for yourself. That's where your judgment matters.  

What did I walk away with?  
- A faster workflow without sacrificing quality.  
- A portfolio site that feels professional, scalable, and polished.  
- Proof that with the right guardrails, AI can be a serious productivity boost.  

So no, AI didn't build this site. But it helped me build it faster, cleaner, and with fewer headaches. If you're willing to keep control of the wheel, Cursor can be a damn good copilot.

