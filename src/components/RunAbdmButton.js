import React from "react";
import { Button, useToast } from "@chakra-ui/react";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { runExcludeMaterialNodeProcessPayload } from "./payloads";

export default function RunAbdmButton({ config, loadMaterialDetails }) {
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
  const [abdmCompleted, setAbdmCompleted] = React.useState(false);

  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      // Use the correct payload for the ABDM process
      const resdata = await getPayloadFromUrl({
        payload: config.abdm(config.src, config.tgt),
      });

      // Check if the response is valid
      const data = JSON.parse(resdata);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response from ABDM process");
      }
      console.log("ABDM process response:", data);
      toast({ title: "ABDM started successfully", status: "success", duration: 3000 });

      // Load Material Definition - Details after ABDM is started
      await loadMaterialDetails();
      setAbdmCompleted(true); // Set completed after successful ABDM and loading
    } catch (err) {
      toast({
        title: "ABDM failed",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setAbdmRunning(false);
    }
  };

  return (
    <Button
      size="sm"
      colorScheme="teal"
      onClick={runAbdm}
      isLoading={abdmRunning}
      aria-label="Run ABDM"
    >
      Run ABDM
    </Button>
  );
}