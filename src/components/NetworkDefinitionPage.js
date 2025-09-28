import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Button, Heading, SimpleGrid } from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { generateGetDataPayload } from "./payloadGenerator";
import { getMaterialDetailsDataPayload, getNetworkMaterialRulesDataPayload, HideDimensions } from "./payloads";
import PlanTypeVersionBox from "./PlanTypeVersionBox";
import { API_BASE_URL } from "./HomePage"; // Import the constant
export default function NetworkDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  onBack,
}) {
  const [abdmCompleted, setAbdmCompleted] = useState(false);
  const [abdmRunKey, setAbdmRunKey] = useState(0);
  const [sheetReloadKey, setSheetReloadKey] = useState(0);

  const [materialDetailsData, setMaterialDetailsData] = useState(null);
  const [materialDetailsLoading, setMaterialDetailsLoading] = useState(false);
  const [materialDetailsError, setMaterialDetailsError] = useState(null);

  const [networkMaterialRulesData, setNetworkMaterialRulesData] = useState(null);
  const [networkMaterialRulesDataLoading, setNetworkMaterialRulesDataLoading] = useState(true);
  const [networkMaterialRulesDataError, setNetworkMaterialRulesDataError] = useState(null);

  const src_tgt = {
    Version: srcVersion,
    "o9NetworkAggregation Network Plan Type": tgtPlan,
    "Data Object": "Exclude Material Node",
  };

  // Load material details
  const loadMaterialDetails = async () => {
    setMaterialDetailsLoading(true);
    setMaterialDetailsError(null);
    try {
      const payload = generateGetDataPayload(getMaterialDetailsDataPayload(srcVersion, tgtPlan)?.Query);
      let data = await getPayloadFromUrl({ payload });
      if (typeof data === "string") {
        data = JSON.parse(data);
        setMaterialDetailsData(data.Results[0]);
      }
      else{
        setMaterialDetailsData(data);
      }
    } catch (err) {
      setMaterialDetailsError(err.message || String(err));
    } finally {
      setMaterialDetailsLoading(false);
    }
  };

  // Trigger `loadMaterialDetails` when `abdmCompleted` is set to true
  useEffect(() => {
    if (abdmRunKey > 0 && abdmCompleted) {
      loadMaterialDetails().catch((err) => console.error("Failed to load material details:", err));
    }
  }, [abdmRunKey, abdmCompleted, srcVersion, tgtPlan]);

  // Load network material rules data
  const loadNetworkMaterialRules = useCallback(async () => {
    setNetworkMaterialRulesDataLoading(true);
    setNetworkMaterialRulesDataError(null);
    try {
      let data = await getPayloadFromUrl({
        payload: generateGetDataPayload(getNetworkMaterialRulesDataPayload(srcVersion, tgtPlan)?.Query),
      });

      if (typeof data === "string") {
        data = JSON.parse(data);
        setNetworkMaterialRulesData(data.Results[0]);
      }
      else{
        console.log("Network material rules data:", data);
        setNetworkMaterialRulesData(data);
      }
    

      
    } catch (error) {
      setNetworkMaterialRulesDataError(error.message || String(error));
    } finally {
      setNetworkMaterialRulesDataLoading(false);
    }
  }, [srcVersion, tgtPlan]);

  useEffect(() => {
    loadNetworkMaterialRules();
  }, [loadNetworkMaterialRules]);

  // Reload network material rules when sheetReloadKey changes
  useEffect(() => {
    if (sheetReloadKey > 0) {
      loadNetworkMaterialRules().catch((err) =>
        console.error("Failed to reload network rules (sheetReloadKey):", err)
      );
    }
  }, [sheetReloadKey, loadNetworkMaterialRules]);

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>
            Back
          </Button>
          <Heading size="md">Material Definition</Heading>
        </Flex>
        <PlanTypeVersionBox
          srcPlan={srcPlan}
          srcVersion={srcVersion}
          tgtPlan={tgtPlan}
          tgtVersion={tgtVersion}
        />
      </Flex>

      {/* Material Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <SimpleGrid columns={1} spacing={6}>
          <SheetComponent
            data={networkMaterialRulesData}
            hideDims={Object.keys(HideDimensions)}
            src_tgt={src_tgt}
            enableEdit={true}
            executeButtons={{
              button1: {
                key: "Run ABDM",
                config: {
                  abdmpayload: "Exclude Material Node",
                },
              },
            }}
            onRequestReload={(reason) => {
              console.log("SheetComponent requested reload:", reason);
              setSheetReloadKey((k) => k + 1);
              loadNetworkMaterialRules().catch((err) =>
                console.error("Failed to reload network rules:", err)
              );
            }}
            onAbdmComplete={(completed) => {
              setAbdmCompleted(completed);
              if (completed) {
                setAbdmRunKey((k) => k + 1);
              }
            }}
          />
        </SimpleGrid>
      </Box>

      {/* Summary of Material Definition */}
      {abdmCompleted && (
        <Box w="100%" mb={6} key={`summary-${abdmRunKey}`}>
          <Heading size="sm" mb={3}>
            Material Definition
          </Heading>
          <SheetComponent
            dataUrl={`${API_BASE_URL}/read/summary_definition1.csv`}
            isLoading={false}
            enableEdit={false}
          />
        </Box>
      )}

      {/* Material Definition - Details */}
      {abdmCompleted && (
        <Box w="100%" mb={6} key={`details-${abdmRunKey}`}>
          <Heading size="sm" mb={3}>
            Material Definition - Details
          </Heading>
          <SimpleGrid columns={1} spacing={6}>
            <SheetComponent
              src_tgt={src_tgt}
              data={materialDetailsData}
              isLoading={materialDetailsLoading}
              error={materialDetailsError}
              hideDims={Object.keys(HideDimensions)}
              executeButtons={{
              button1: {
                key: "Generate Material Exclusion",
                config: {
                  abdmpayload: "Generate Material Exclusion",
                },
              },
            }}
            onRequestReload={(reason) => {
              console.log("SheetComponent requested reload:", reason);
              setSheetReloadKey((k) => k + 1);
              loadMaterialDetails().catch((err) =>
                console.error("Failed to reload material details:", err)
              );
            }}
            />
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
