import React from "react";
import { Button, useToast } from "@chakra-ui/react";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import {Version, NetworkPlanType, DMRule} from "./payloads";
import { runExcludeMaterialNodeProcessPayload,runExcludeResourceNodeProcessPayload ,generateMaterialExclusionPayload,generateResourceExclusionPayload} from "./payloads";
import { convertListToFilterFormat } from "./SheetFunctions";
import { executeIBPL,executeActionButton } from "./o9Interfacehelper";
export default function RunAbdmButton({Name,src_tgt, config, onAbdmComplete }) {
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
  const isNoImpactResult = (result) => {
    return (
      result?.ImpactResult?.length === 0 &&
      result?.Results?.[0]?.Measures?.length === 0
    );
  };
  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      const payload = {
        Version: src_tgt[Version],
        PlanType: src_tgt[NetworkPlanType],
        Data_Object: config.abdmpayload,
        Rule: config.selectedFilters[DMRule] || [],
      };
      console.log("Payload for ABDM:", payload);

      let resdata;
      if (config.abdmpayload === "Exclude Material Node") {
        resdata = await executeActionButton({ actionButton: "SupplyPlan0017AggregationMaterialSkipRuleABDM", payload });
      } else if (config.abdmpayload === "Exclude Resource Node") {
        resdata = await executeActionButton({ actionButton: "SupplyPlan0017AggregationResourceSkipRuleABDM", payload });
      } else if (config.abdmpayload === "Generate Material Exclusion") {
        resdata = await executeActionButton({ actionButton: "SupplyPlan0010AggregationPreprocessingMaterialSkip", payload });
      } else if (config.abdmpayload === "Generate Resource Exclusion") {
        resdata = await executeActionButton({ actionButton: "SupplyPlan0011AggregationPreprocessingResourceSkip", payload });
      }

      if (typeof resdata === "string") {
        try {
          resdata = JSON.parse(resdata);
          console.log("ABDM Response Data:", resdata); 
        } catch (parseError) {
          throw new Error(`Failed to parse ${Name} process response as JSON: ` + parseError.message);
        }
      }

      if (isNoImpactResult(resdata)) {
        toast({
          title: "No impact detected",
          description: "The operation completed successfully but resulted in no impact.",
          status: "warning",
          duration: 5000,
        });
      } else {
        toast({
          title: `${Name} Completed successfully`,
          status: "success",
          duration: 3000,
        });
      }

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

