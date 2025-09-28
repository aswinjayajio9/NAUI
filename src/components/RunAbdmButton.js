import React from "react";
import { Button, useToast } from "@chakra-ui/react";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import {Version, NetworkPlanType} from "./payloads";
import { runExcludeMaterialNodeProcessPayload,runExcludeResourceNodeProcessPayload ,generateMaterialExclusionPayload,generateResourceExclusionPayload} from "./payloads";
import { convertListToFilterFormat } from "./SheetFunctions";
import { executeIBPL } from "./o9Interfacehelper";
export default function RunAbdmButton({Name,src_tgt, config, onAbdmComplete }) {
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
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
      else if (config.abdmpayload === "Generate Material Exclusion") {
        config.abdmpayload = generateMaterialExclusionPayload(src_tgt[Version],src_tgt[NetworkPlanType]);
      }
      else if (config.abdmpayload === "Generate Resource Exclusion") {
        config.abdmpayload = generateResourceExclusionPayload(src_tgt[Version],src_tgt[NetworkPlanType]);
      }
      var resdata = await executeIBPL({
        payload: config.abdmpayload,
      });
      if (typeof resdata === "string") {
        // Attempt to parse the response as JSON
        try { 
          resdata = JSON.parse(resdata);
        } catch (parseError) {
          throw new Error(`Failed to parse ${Name} process response as JSON: ` + parseError.message);
        }
      } else {
        resdata = resdata;
      }
      toast({ title: `${Name} Completed successfully`, status: "success", duration: 3000 });

      // Notify parent component that ABDM is completed
      if (onAbdmComplete) {
        onAbdmComplete(true); // Call the callback with `true`
      }
    } catch (err) {
      toast({
        title: `${Name} failed`,
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
      {Name}
    </Button>
  );
}

