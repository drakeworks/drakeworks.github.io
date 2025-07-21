# DrakeWorks Blog and Portfolio

A personal blog and portfolio site built with Jekyll. This site features blog posts, a video section, and a gallery, showcasing various projects and content.

## Technologies Used

- Jekyll
- HTML
- CSS
- JavaScript

## Setup

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/drakeworks/drakeworks.github.io.git
    cd drakeworks.github.io
    ```

2.  **Install Jekyll and Bundler** (if you haven't already):
    ```bash
    # macOS
    brew install ruby
    gem install bundler

    # Ubuntu/Debian
    sudo apt-get install ruby-full
    gem install bundler
    ```

3.  **Install dependencies:**
    ```bash
    bundle install
    ```

4.  **Serve the site locally:**
    ```bash
    bundle exec jekyll serve
    ```

5.  Open your browser and visit `http://localhost:4000`

## Project Structure

- `_config.yml`: Site configuration.
- `_data/`: Data files for navigation and social links.
- `_includes/`: Reusable HTML components (header, footer, sections, sidebar).
- `_layouts/`: Layouts for pages and posts.
- `_posts/`: Markdown files for blog posts.
- `_videos/`: Markdown files for video posts.
- `css/`: Custom CSS files (`main.css`).
- `js/`: JavaScript files.
- `images/`: Site images.
- `index.html`: The homepage.

## Customization

- Site settings: `_config.yml`
- Navigation: `_data/navigation.yml`
- Social links: `_data/social.yml`
- Styling: `css/main.css`
- Layouts: `_layouts/`
- Components: `_includes/`

## Content

- Blog posts are located in `_posts/`.
- Video posts are located in `_videos/`.
- Gallery images can be managed in `images/gallery/` and potentially configured in includes.

## Deployment

This project uses a staging-to-production deployment workflow:

### Staging Repository
- **Purpose**: Development and testing environment
- **Branch**: `main`

### Production Repository  
- **Purpose**: Live site deployment
- **Branch**: `main`

### Manual Deployment

To deploy from staging to production:

1. **Set up GitHub Token** (one-time setup):
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a new token with `repo` permissions
   - Add the token as a repository secret named `PRODUCTION_TOKEN` in the staging repository

2. **Trigger Deployment**:
   - Go to the staging repository on GitHub
   - Navigate to Actions → "Deploy to Production"
   - Click "Run workflow"
   - Set "Deploy to production?" to `true`
   - Click "Run workflow"

The workflow will:
- Checkout the staging repository
- Copy files to the production repository
- Trigger the build workflow in the production repository
- Deploy the site to GitHub Pages

### Workflow Setup

**Both Repositories** have the same workflow file (`.github/workflows/jekyll.yml`):

**Staging Repository**:
- ✅ Has deployment workflow (`.github/workflows/deploy-to-production.yml`)
- ✅ Has build workflow (builds but doesn't deploy)
- 🔄 Manual deployment trigger
- 🔄 Automatic build on push (continues if error)

**Production Repository**:
- ✅ Has build and deploy workflow (same file as staging)
- ✅ Automatically builds and deploys when content is pushed
- ✅ Deploys to GitHub Pages
- 🔄 Triggered by staging deployment or direct pushes

## Credits

This site uses the following resources:

- [Font Awesome](https://fontawesome.com/) for icons
- [Splide](https://splidejs.com/) for carousels
- [Google Fonts](https://fonts.google.com/) for typography
