# AI StoryTeller

> Creative AI web application for generating stories, game concepts, and educational content with Google Gemini.

AI StoryTeller turns structured prompts into interactive creative experiences and combines AI generation with authentication, persistence, and a responsive web interface.

## Features

- Story Studio with genre, character, and plot controls
- Game Design Hub for generating game concepts
- Educational Companion for conversational topic exploration
- Personal dashboard for generated and saved content
- Firebase authentication
- Text-to-speech for generated stories
- Responsive glassmorphism-inspired UI

## Architecture

```
Web UI
  |
  +---- Gemini API ----> AI generation
  |
  +---- Firebase -----> Authentication + data
```

## Tech stack

- HTML5 / JavaScript ES modules
- Vite
- CSS / Tailwind CSS
- Google Gemini API
- Firebase Authentication
- Firestore

## Run locally

```bash
git clone https://github.com/aruna-31/story_generator.git
cd story_generator
npm install
npm run dev
```

Create a local `.env` file with the required Gemini and Firebase configuration. Never commit API keys.

## Author

**Lavanuru Aruna** · https://github.com/aruna-31
