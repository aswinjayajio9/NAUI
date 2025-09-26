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
  runExcludeMaterialNodeProcessPayload,
} from "./payloads";

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

      setMaterialDetailsData(data["Results"]["0"]);
      toast({
        title: "Material details loaded successfully",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      setMaterialDetailsError(err.message || String(err));
      toast({
        title: "Failed to load material details",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setMaterialDetailsLoading(false);
    }
  };

  // Trigger `loadMaterialDetails` when `abdmCompleted` is set to true
  useEffect(() => {
    if (abdmCompleted) {
      loadMaterialDetails();
    }
  }, [abdmCompleted, srcVersion, tgtPlan]); // Dependencies include `abdmCompleted`, `srcVersion`, and `tgtPlan`

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
          <Heading size="md">Network Model - Definition</Heading>
        </Flex>
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
                  data_object: data_object,
                  abdmpayload: runExcludeMaterialNodeProcessPayload(srcVersion, tgtPlan),
                },
              },
            }}
            onAbdmComplete={(completed) => setAbdmCompleted(completed)}
                      />
        </SimpleGrid>
      </Box>

      {/* Summary of Material Definition */}
      {abdmCompleted && (
        <Box w="100%" mb={6}>
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
        <Box w="100%" mb={6}>
          <Heading size="sm" mb={3}>
            Material Definition - Details</Heading>
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
