import React, { useState, useEffect, useCallback } from "react";
import { Box, Flex, Button, Heading, SimpleGrid } from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { getResourceDetailsPayload, getResourceRulesPayload, HideDimensions } from "./payloads";
import PlanTypeVersionBox from "./PlanTypeVersionBox";
import { API_BASE_URL } from "./HomePage"; // Import the constant
export default function ResourceDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  onBack,
}) {
  const [abdmCompleted, setAbdmCompleted] = useState(false);
  const [abdmRunKey, setAbdmRunKey] = useState(0);
  const [sheetReloadKey, setSheetReloadKey] = useState(0);

  const [resourceDetailsData, setResourceDetailsData] = useState(null);
  const [resourceDetailsLoading, setResourceDetailsLoading] = useState(false);
  const [resourceDetailsError, setResourceDetailsError] = useState(null);

  const [resourceRulesData, setResourceRulesData] = useState(null);
  const [resourceRulesLoading, setResourceRulesLoading] = useState(true);
  const [resourceRulesError, setResourceRulesError] = useState(null);

  const src_tgt = {
    Version: srcVersion,
    "o9NetworkAggregation Network Plan Type": tgtPlan,
    "Data Object": "Exclude Resource Node",
  };

  // Load resource details
  const loadResourceDetails = async () => {
    setResourceDetailsLoading(true);
    setResourceDetailsError(null);
    try {
      const payload = getResourceDetailsPayload(srcVersion, tgtPlan);
      let data = await getPayloadFromUrl({ payload });

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      if (!data?.Results?.[0]) {
        throw new Error("Invalid API response: Missing or empty 'Results' array");
      }

      setResourceDetailsData(data.Results[0]);
    } catch (err) {
      setResourceDetailsError(err.message || String(err));
    } finally {
      setResourceDetailsLoading(false);
    }
  };

  // Trigger `loadResourceDetails` when `abdmCompleted` is set to true
  useEffect(() => {
    if (abdmRunKey > 0 && abdmCompleted) {
      loadResourceDetails().catch((err) => console.error("Failed to load resource details:", err));
    }
  }, [abdmRunKey, abdmCompleted, srcVersion, tgtPlan]);

  // Load resource rules data
  const loadResourceRules = useCallback(async () => {
    setResourceRulesLoading(true);
    setResourceRulesError(null);
    try {
      let data = await getPayloadFromUrl({
        payload: getResourceRulesPayload(srcVersion, tgtPlan),
      });

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      if (!data?.Results?.[0]) {
        throw new Error("Invalid API response: Missing or empty 'Results' array");
      }

      setResourceRulesData(data.Results[0]);
    } catch (error) {
      setResourceRulesError(error.message || String(error));
    } finally {
      setResourceRulesLoading(false);
    }
  }, [srcVersion, tgtPlan]);

  useEffect(() => {
    loadResourceRules();
  }, [loadResourceRules]);

  // Reload resource rules when sheetReloadKey changes
  useEffect(() => {
    if (sheetReloadKey > 0) {
      loadResourceRules().catch((err) =>
        console.error("Failed to reload resource rules (sheetReloadKey):", err)
      );
    }
  }, [sheetReloadKey, loadResourceRules]);

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>
            Back
          </Button>
          <Heading size="md">Resource Definition</Heading>
        </Flex>
        <PlanTypeVersionBox
          srcPlan={srcPlan}
          srcVersion={srcVersion}
          tgtPlan={tgtPlan}
          tgtVersion={tgtVersion}
        />
      </Flex>

      {/* Resource Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <SimpleGrid columns={1} spacing={6}>
          <SheetComponent
            data={resourceRulesData}
            hideDims={Object.keys(HideDimensions)}
            src_tgt={src_tgt}
            enableEdit={true}
            executeButtons={{
              button1: {
                key: "Run ABDM",
                config: {
                  abdmpayload: "Exclude Resource Node",
                },
              },
            }}
            onRequestReload={(reason) => {
              console.log("SheetComponent requested reload:", reason);
              setSheetReloadKey((k) => k + 1);
              loadResourceRules().catch((err) =>
                console.error("Failed to reload resource rules:", err)
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

      {/* Summary of Resource Definition */}
      {abdmCompleted && (
        <Box w="100%" mb={6} key={`summary-${abdmRunKey}`}>
          <Heading size="sm" mb={3}>
            Resource Definition
          </Heading>
          <SheetComponent
            dataUrl={`${API_BASE_URL}/read/summary_resource1.csv`}
            isLoading={false}
            enableEdit={false}
          />
        </Box>
      )}

      {/* Resource Definition - Details */}
      {abdmCompleted && (
        <Box w="100%" mb={6} key={`details-${abdmRunKey}`}>
          <Heading size="sm" mb={3}>
            Resource Definition - Details
          </Heading>
          <SimpleGrid columns={1} spacing={6}>
            <SheetComponent
              src_tgt={src_tgt}
              data={resourceDetailsData}
              isLoading={resourceDetailsLoading}
              error={resourceDetailsError}
              hideDims={Object.keys(HideDimensions)}
            />
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
