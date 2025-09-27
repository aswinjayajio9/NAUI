import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  useToast,
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import { API_BASE_URL } from "./HomePage";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import {
  getMaterialDetailsDataPayload,
  getNetworkMaterialRulesDataPayload,
  HideDimensions,
} from "./payloads";
import PlanTypeVersionBox from "./PlanTypeVersionBox"; // Import the new component

export default function NetworkDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  onNext,
  onPrev,
  isFirst,
  isLast,
}) {
  const toast = useToast();
  const [abdmCompleted, setAbdmCompleted] = useState(false); // Track if ABDM is completed
  const [abdmRunKey, setAbdmRunKey] = useState(0); // increment to force reload when ABDM completes again
  const [materialDetailsData, setMaterialDetailsData] = useState(null);
  const [materialDetailsLoading, setMaterialDetailsLoading] = useState(false);
  const [materialDetailsError, setMaterialDetailsError] = useState(null);

  const [networkMaterialRulesData, setNetworkMaterialRulesData] = useState(null);
  const [networkMaterialRulesDataLoading, setNetworkMaterialRulesDataLoading] =
    useState(true);
  const [
    networkMaterialRulesDataError,
    setNetworkMaterialRulesDataSummaryError,
  ] = useState(null);

  const [summaryDefinition1Data, setSummaryDefinition1Data] = useState(null);
  const [summaryDefinition1Loading, setSummaryDefinition1Loading] =
    useState(true);
  const [summaryDefinition1Error, setSummaryDefinition1Error] = useState(null);

  const [data_object, setDataObject] = useState("Exclude Material Node");
  const src_tgt = {
    Version: srcVersion,
    "o9NetworkAggregation Network Plan Type": tgtPlan,
    "Data Object": data_object,
  };

  // Function to load material details
  const loadMaterialDetails = async () => {
    console.log("loadMaterialDetails triggered");
    setMaterialDetailsLoading(true);
    setMaterialDetailsError(null);
    try {
      const payload = getMaterialDetailsDataPayload(srcVersion, tgtPlan);
      let data = await getPayloadFromUrl({ payload });

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (parseError) {
          throw new Error(
            "Failed to parse API response as JSON: " + parseError.message
          );
        }
      }

      if (
        !data ||
        !data["Results"] ||
        !Array.isArray(data["Results"]) ||
        data["Results"].length === 0
      ) {
        throw new Error(
          "Invalid API response: Missing or empty 'Results' array"
        );
      }

      console.log("Material details data loaded:", data["Results"]["0"]);
      setMaterialDetailsData(data["Results"]["0"]);
    } catch (err) {
      console.error("Error in loadMaterialDetails:", err);
      setMaterialDetailsError(err.message || String(err));
    } finally {
      setMaterialDetailsLoading(false);
    }
  };

  // Trigger `loadMaterialDetails` when `abdmCompleted` is set to true
  useEffect(() => {
    // run loadMaterialDetails whenever a successful ABDM run increments the key
    if (abdmRunKey > 0 && abdmCompleted) {
      loadMaterialDetails().catch((err) => {
        console.error("Failed to load material details:", err);
      });
    }
  }, [abdmRunKey, abdmCompleted, srcVersion, tgtPlan]); // depend on run key

  console.log("abdmCompleted in render:", abdmCompleted);

  // Load network material rules data on component mount
  useEffect(() => {
    setNetworkMaterialRulesDataLoading(true);
    getPayloadFromUrl({
      payload: getNetworkMaterialRulesDataPayload(srcVersion, tgtPlan),
    })
      .then((data) => {
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            throw new Error(
              "Failed to parse API response as JSON: " + parseError.message
            );
          }
        }
        if (
          !data ||
          !data["Results"] ||
          !Array.isArray(data["Results"]) ||
          data["Results"].length === 0
        ) {
          throw new Error(
            "Invalid API response: Missing or empty 'Results' array"
          );
        }
        setNetworkMaterialRulesData(data["Results"]["0"]);
      })
      .catch((error) => {
        setNetworkMaterialRulesDataSummaryError(error.message);
      })
      .finally(() => {
        setNetworkMaterialRulesDataLoading(false);
      });
  }, [srcVersion, tgtPlan]);

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
            dataUrl={`${API_BASE_URL}/read/material_definition_rules.csv`}
            data={networkMaterialRulesData}
            hideDims={Object.keys(HideDimensions)}
            src_tgt={src_tgt}
            enableEdit={true}
             executeButtons={{
              button1: {
                key: "Run ABDM",
                config: {
                  abdmpayload: "Exclude Material Node" ,
                },
              },
            }}
            onAbdmComplete={(completed) => {
              setAbdmCompleted(completed);
              if (completed) setAbdmRunKey((k) => k + 1); // force effect and remounts
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
            isLoading={summaryDefinition1Loading}
            error={summaryDefinition1Error}
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
            />
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
