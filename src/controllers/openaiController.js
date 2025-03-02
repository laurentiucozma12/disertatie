const openai = require("../config/openaiConfig"); // Import the openai instance

const generateMeta = async (req, res) => {
  const { title } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Come up with a description for a YouTube video called "${title}"`,
        },
      ],
      max_tokens: 100,
    });

    console.log("OpenAI API Response:", response);

    res.status(200).json({ description: response.choices[0].message.content });
  } catch (error) {
    console.error("Error in generateMeta:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating metadata." });
  }
};

module.exports = { generateMeta };
