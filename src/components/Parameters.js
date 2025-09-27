import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import PlanTypeVersionBox from "./PlanTypeVersionBox"; // Import the new component
import { API_BASE_URL } from "./HomePage"; // Import the constant
import { getPayloadForParameters, HideDimensions } from "./payloads";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { new_component } from "./HomePage";
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
  onNext,    // injected by DefinitionWizard
  onPrev,    // injected by DefinitionWizard
  isFirst,   // injected by DefinitionWizard
  isLast,    // injected by DefinitionWizard
}) {
  const [summaryParameters, setSummaryParameters] = useState([]);
  const [summaryParametersLoading, setSummaryParametersLoading] = useState(true);
  const [summaryParametersError, setSummaryParametersError] = useState(null);
  const src_tgt = { 'Version':srcVersion, 'o9NetworkAggregation Network Plan Type': tgtPlan, 'o9PC Component': new_component };
  useEffect(() => {
    const loadParameters = async () => {
      setSummaryParametersLoading(true);
      setSummaryParametersError(null);
      try {
        const payload = getPayloadForParameters(srcVersion,new_component);
        let data = await getPayloadFromUrl({ payload });
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        setSummaryParameters(data["Results"]["0"]);
        console.log("Parameters data:", data);
      } catch (error) {
        console.error("Error loading parameters:", error);
        setSummaryParametersError(error.message || "Failed to load parameters");
      } finally {
        setSummaryParametersLoading(false);
      }
    };

    loadParameters();
  }, [srcVersion, tgtPlan]);

  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>Back</Button>
          <Heading size="md">Parameter Definition</Heading>
        </Flex>
        <PlanTypeVersionBox 
          srcPlan={srcPlan} 
          srcVersion={srcVersion} 
          tgtPlan={tgtPlan} 
          tgtVersion={tgtVersion} 
        />
      </Flex>
      <Heading size="sm" mb={3}>
        Parameters
      </Heading>
      <SheetComponent 
        dataUrl={`${API_BASE_URL}/read/parameters.csv`}
        data={summaryParameters}
        isLoading={summaryParametersLoading}
        error={summaryParametersError}
        enableEdit={true}
        hideDims={Object.keys(HideDimensions)}
      />
    </Box>
  );
}