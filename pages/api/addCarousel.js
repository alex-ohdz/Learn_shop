import multer from "multer";
import { query } from "@/lib/db";

// Configurar multer para almacenar las imágenes en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10 }, // Limitar el número máximo de archivos a 10
});

// Middleware para manejar la subida de las imágenes
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  const method = req.method;

  switch (method) {
    case "POST":
      await handlePost(req, res);
      break;
    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

const handlePost = async (req, res) => {
  await new Promise((resolve, reject) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const images = req.files.map(file => file.buffer.toString("base64"));
    const values = images.map((image, index) => `($${index + 1})`).join(", ");
    const queryText = `INSERT INTO home_carousel (image) VALUES ${values} RETURNING *`;

    const result = await query(queryText, images);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ error: `Error executing query: ${error.message}` });
  }
};

export default handler;
