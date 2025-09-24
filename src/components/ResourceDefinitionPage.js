import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  Text,
  Stack,
  useToast,
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { API_BASE_URL } from "./HomePage"; // Import the constant
import {
  getResourceDetailsPayload,
  getResourceRulesPayload,
  runExcludeResourceNodeProcessPayload,
  HideDimensions,
} from "./payloads";
import PlanTypeVersionBox from "./PlanTypeVersionBox"; // Import the new component
/*
  ResourceDefinitionPage
  - Clean page: parent provides step control.
*/

export default function ResourceDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  onNext, // injected by DefinitionWizard
  onPrev, // injected by DefinitionWizard
  isFirst, // injected by DefinitionWizard
  isLast, // injected by DefinitionWizard
}) {
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = useState(false);
  const [abdmCompleted, setAbdmCompleted] = useState(false); // New state to track if ABDM has completed

  // States for Resource Definition - Rules
  const [resourceRulesData, setResourceRulesData] = useState(null);
  const [resourceRulesLoading, setResourceRulesLoading] = useState(true);
  const [resourceRulesError, setResourceRulesError] = useState(null);

  // States for Resource Definition - Details (loaded after ABDM)
  const [resourceDetailsData, setResourceDetailsData] = useState(null);
  const [resourceDetailsLoading, setResourceDetailsLoading] = useState(false);
  const [resourceDetailsError, setResourceDetailsError] = useState(null);

  // States for Summary Resources
  const [summaryResource1Data, setSummaryResource1Data] = useState(null);
  const [summaryResource1Loading, setSummaryResource1Loading] = useState(true);
  const [summaryResource1Error, setSummaryResource1Error] = useState(null);

  const [data_object, setDataObject] = useState("Exclude Resource Node");
  const src_tgt = { src: srcVersion, tgt: tgtPlan, data_object: data_object };

  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      // Use the correct payload for the ABDM process
      const resdata = await getPayloadFromUrl({
        payload: runExcludeResourceNodeProcessPayload(srcVersion, tgtPlan),
      });

      // Check if the response is valid
      const data = JSON.parse(resdata);
      if (!data || typeof data !== "object") {
        throw new Error("Invalid response from ABDM process");
      }
      console.log("ABDM process response:", data);
      toast({ title: "ABDM started successfully", status: "success", duration: 3000 });

      // Load Resource Definition - Details after ABDM is started
      await loadResourceDetails();
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

  const loadResourceDetails = async () => {
    setResourceDetailsLoading(true);
    setResourceDetailsError(null);
    try {
      const data = await getPayloadFromUrl({
        payload: getResourceDetailsPayload(srcVersion, tgtPlan),
      });
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;

      if (
        !parsedData ||
        !parsedData["Results"] ||
        !Array.isArray(parsedData["Results"]) ||
        parsedData["Results"].length === 0
      ) {
        throw new Error("Invalid API response: Missing or empty 'Results' array");
      }
      setResourceDetailsData(parsedData["Results"]["0"]);
    } catch (err) {
      setResourceDetailsError(err.message || String(err));
    } finally {
      setResourceDetailsLoading(false);
    }
  };

  useEffect(() => {
    setResourceRulesLoading(true);
    getPayloadFromUrl({ payload: getResourceRulesPayload(srcVersion, tgtPlan) })
      .then((data) => {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        if (
          !parsedData ||
          !parsedData["Results"] ||
          !Array.isArray(parsedData["Results"]) ||
          parsedData["Results"].length === 0
        ) {
          throw new Error("Invalid API response: Missing or empty 'Results' array");
        }
        setResourceRulesData(parsedData["Results"]["0"]);
      })
      .catch((error) => {
        setResourceRulesError(error.message);
      })
      .finally(() => {
        setResourceRulesLoading(false);
      });
  }, []);

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
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">Resource Definition - Rules</Heading>
          <Button
            size="sm"
            colorScheme="teal"
            onClick={runAbdm}
            isLoading={abdmRunning}
            aria-label="Run ABDM"
          >
            Run ABDM
          </Button>
        </Flex>
        <SimpleGrid columns={1} spacing={6}>
          <SheetComponent
            data={resourceRulesData}
            isLoading={resourceRulesLoading}
            error={resourceRulesError}
            hideDims={Object.keys(HideDimensions)}
            src_tgt={src_tgt}
          />
        </SimpleGrid>
      </Box>

      {/* Summary of Resource Definition */}
      {abdmCompleted &&(<Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
          Summary of Resource Definition
        </Heading>

          <SheetComponent
            dataUrl={`${API_BASE_URL}/read/summary_resource1.csv`}
            // data={summaryResource1Data}
            isLoading={summaryResource1Loading}
            error={summaryResource1Error}
            enableEdit={false}
            hideDims={Object.keys(HideDimensions)}
          />
      </Box>)}

      {/* Resource Definition - Details (toggle Table / Network) - Only visible after ABDM */}
      {abdmCompleted && (
        <Box w="100%" mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm">Resource Definition - Details</Heading>
          </Flex>
          <SimpleGrid columns={1} spacing={6}>
            <SheetComponent
              data={resourceDetailsData}
              isLoading={resourceDetailsLoading}
              error={resourceDetailsError}
              hideDims={Object.keys(HideDimensions)}
              src_tgt={src_tgt}
            />
          </SimpleGrid>
        </Box>
      )}

      {/* Page-level navigation (restores Next/Previous buttons on the page) */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Button size="sm" onClick={onPrev} isDisabled={isFirst}>
          Previous
        </Button>
        <Button size="sm" colorScheme="blue" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
}
