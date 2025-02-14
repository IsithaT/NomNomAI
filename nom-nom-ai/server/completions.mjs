import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); // Add this line before other middleware
app.use(express.json());

// Store the assistant ID after creation
let ASSISTANT_ID;

// Initialize the assistant
async function initializeAssistant() {
  try {
    // Create a new assistant if ASSISTANT_ID is not provided in env
    if (!process.env.ASSISTANT_ID) {
      const assistant = await openai.beta.assistants.create({
        name: "Chat Assistant",
        instructions: "You are a helpful assistant. Engage in friendly and informative conversations.",
        model: "gpt-4o"
      });
      ASSISTANT_ID = assistant.id;
      console.log('Created new assistant with ID:', ASSISTANT_ID);
    } else {
      ASSISTANT_ID = process.env.ASSISTANT_ID;
      console.log('Using existing assistant ID:', ASSISTANT_ID);
    }
  } catch (error) {
    console.error('Error initializing assistant:', error);
    throw error;
  }
}

// Create a new thread
app.post('/api/thread', async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res.json({
      success: true,
      threadId: thread.id
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message and get response
app.post('/api/chat', async (req, res) => {
  try {
    const { threadId, message } = req.body;

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message
    });

    // Create a run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Poll for the run completion with exponential backoff
    const maxRetries = 10;
    let retryCount = 0;
    let runStatus;

    while (retryCount < maxRetries) {
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      if (runStatus.status === 'completed') {
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error(`Assistant run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
      }

      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
    }

    if (retryCount === maxRetries) {
      throw new Error('Max retries reached, request timed out');
    }

    // Get the messages (including the assistant's response)
    const messages = await openai.beta.threads.messages.list(threadId);

    // Get the latest assistant message
    const assistantMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .shift();

    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    res.json({
      success: true,
      response: assistantMessage.content[0].text.value
    });

  } catch (error) {
    console.error('Error processing request:', error);

    // Check if it's an OpenAI API error
    if (error.response && error.response.data) {
      console.error('OpenAI API Error:', error.response.data);
    }

    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
});


app.post('/api/voicetotext', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    // Assign the original filename to the file stream so the API correctly registers the extension.
    const fileStream = Object.assign(fs.createReadStream(req.file.path), { filename: req.file.originalname });

    const transcript = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1"
    });

    res.json({ success: true, text: transcript.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up the temporary file from disk
    if (req.file?.path) {
      fs.unlink(req.file.path, err => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }
  }
});

app.post('/api/texttomp3', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'No text provided' });
    }

    // Generate the audio using OpenAI's speech synthesis
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text
    });

    const arrayBuffer = await mp3.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set appropriate headers and return the audio file back to the client
    res.set('Content-Type', 'audio/mp3');
    res.send(buffer);
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize the assistant and start the server
initializeAssistant()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });