import { useState } from "react";

import Button from "./composants/ui/Button";
import TextArea from "./composants/ui/TextArea";

export default function App() {
  const [description, setDescription] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [error, setError] =
    useState("");

  function handleSubmit() {
    if (!description.trim()) {
      setError(
        "La description est obligatoire."
      );

      return;
    }

    setError("");

    console.log({
      description,
      comment,
    });
  }

  return (
    <main
      style={{
        width: "min(100% - 32px, 560px)",
        margin: "40px auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >

      <TextArea
        label="Description du championnat"
        name="description"
        placeholder="Présentez brièvement le championnat..."
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);

          if (error) {
            setError("");
          }
        }}
        error={error}
        helperText="Cette description sera visible par les supporters."
        rows={5}
        maxLength={500}
        showCharacterCount
        required
      />

      <TextArea
        label="Commentaire du match"
        name="comment"
        placeholder="Décrivez l’action du match..."
        value={comment}
        onChange={(event) =>
          setComment(event.target.value)
        }
        helperText="Évitez les informations personnelles inutiles."
        rows={4}
        maxLength={250}
        showCharacterCount
        resize="none"
      />

      <TextArea
        label="Information non modifiable"
        value="Match programmé au stade municipal."
        readOnly
        resize="none"
      />

      <TextArea
        label="Champ indisponible"
        placeholder="Saisie indisponible"
        disabled
      />

      <Button
        type="button"
        fullWidth
        onClick={handleSubmit}
      >
        Enregistrer
      </Button>
    </main>
  );
}