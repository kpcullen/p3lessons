require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const Note = require("./models/note");
// const mongoose = require("mongoose");
// require("dotenv").config();
// const url = process.env.MONGODB_URI;

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

app.use(cors());
app.use(express.static("dist"));
app.use(express.json());
app.use(requestLogger);

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// mongoose.set("strictQuery", false);

// mongoose
//   .connect(url)
//   .then(() => {
//     console.log("connected to MonogDB!");
//   })
//   .catch((err) => {
//     console.log("ERROR CONNECTING:", err.message);
//   });

// const noteSchema = new mongoose.Schema({
//   content: String,
//   important: Boolean,
// });

// noteSchema.set("toJSON", {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString();
//     delete returnedObject._id;
//     delete returnedObject.__v;
//   },
// });

// const Note = mongoose.model("Note", noteSchema);

// function generateId() {
//   const maxId =
//     notes.length > 0 ? Math.max(...notes.map((note) => +note.id)) : 0;
//   return String(maxId + 1);
// }

app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes) => {
    response.json(notes);
  });
});

// app.put("/api/notes", (request, response) => {
//   response.json(notes);
// });

// app.get("/api/notes/:id", (request, response) => {
//   const id = +request.params.id;
//   const note = notes.find((note) => note.id === id);
//   if (note) return response.json(note);
//   if (!note) return response.status(404).send("Note does not exist");
// });

app.get("/api/notes/:id", (request, response) => {
  Note.findById(request.params.id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((err) => next(err));
});

// app.delete("/api/notes/:id", (request, response) => {
//   const id = +request.params.id;
//   notes = notes.filter((note) => note.id !== id);

//   response.status(204).end();
// });

app.delete("/api/notes/:id", (request, response, next) => {
  const { content, important } = request.body;

  Note.findByIdAndDelete(
    request.params.id,
    { content, important },
    { new: true, runValidators: true, context: "query" }
  )
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  // if (!body.content) {
  //   return response.status(400).json({
  //     error: "content missing",
  //   });
  // }

  const note = new Note({
    content: body.content,
    important: body.important || false,
  });

  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((err) => next(err));
});

app.put("/api/notes/:id", (request, response, next) => {
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  };

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => next(error));
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
