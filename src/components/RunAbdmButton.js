import React from "react";
import { Button, useToast } from "@chakra-ui/react";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { runExcludeMaterialNodeProcessPayload,runExcludeResourceNodeProcessPayload } from "./payloads";
import { convertListToFilterFormat } from "./SheetFunctions";

export default function RunAbdmButton({ config, onAbdmComplete }) {
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
  const abdms = {
    "Exclude Material Node": runExcludeMaterialNodeProcessPayload,
    "Exclude Resource Node": runExcludeResourceNodeProcessPayload,
  };
  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      // Use the correct payload for the ABDM process
      // if (config.has.selectedFilters) {
      //   config.selectedFilters 
      // }
      if (config.abdmpayload === "Exclude Material Node") {
        config.abdmpayload = runExcludeMaterialNodeProcessPayload(convertListToFilterFormat(config.selectedFilters));
      }
      else if (config.abdmpayload === "Exclude Resource Node") {
        config.abdmpayload = runExcludeResourceNodeProcessPayload(convertListToFilterFormat(config.selectedFilters));
      }
      const resdata = await getPayloadFromUrl({
        payload: config.abdmpayload ,
      });

      // Check if the response is valid
      const data = JSON.parse(resdata);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid response from ABDM process");
      }
      console.log("ABDM process response:", data);
      toast({ title: "ABDM started successfully", status: "success", duration: 3000 });

      // Notify parent component that ABDM is completed
      if (onAbdmComplete) {
        onAbdmComplete(true); // Call the callback with `true`
      }
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
      colorScheme="blue"
      onClick={runAbdm}
      isLoading={abdmRunning}
      aria-label="Run ABDM"
    >
      Run ABDM
    </Button>
  );
}