Integrating Federal and State, Local, and Education Small Business Contract Awards: An Architectural and Practical Framework
The consolidation of public procurement data from disparate government registries is a primary objective for data architects and capture managers seeking predictive business development intelligence.[1, 2] Bridging the gap between the structured federal contracting registries and the fragmented State, Local, and Education (SLED) domain requires a systematic framework for data extraction, schema standardization, and programmatic synchronization.[3, 4, 5]
To satisfy the objective of assembling and querying a unified database of contract awards provided to small businesses over a two-year lookback period—historically defined from June 13, 2024, to June 13, 2026—this framework outlines the APIs, data structures, and programmatic workflows necessary for seamless integration.
---

## Architectural Transition of Federal Procurement Registries
Historically, the Federal Procurement Data System (FPDS.gov) served as the central clearinghouse for contract action reports (CARs).[4, 6] However, a multi-year modernization initiative led by the General Services Administration (GSA) resulted in the decommissioning of legacy FPDS search functions, such as ezSearch, on February 24, 2026.[6]
The GSA transitioned these capabilities to SAM.gov, shifting the underlying data pipeline from legacy legacy Atom Feeds to the modernized, RESTful SAM.gov Contract Awards API hosted on open.gsa.gov.[6, 7]
To integrate federal awards, data pipelines must interact with two distinct federal web services [1, 4, 8]:
| Architectural Attribute | SAM.gov Contract Awards API [9] | USAspending.gov Advanced Search API [1, 3, 13] |
| --- | --- | --- |
| **Endpoint URL** | `https://api.sam.gov/api/v1/contract-awards` | `https://api.usaspending.gov/api/v2/search/spending_by_award/` |
| **HTTP Verb** | GET | POST |
| **Auth Protocol** | Query Parameter (`api_key`) | Open Access (No Token Required) |
| **Rate Limiting** | Throttled by Tier (Requires GSA System Account) | Unrestricted / Soft-Throttled |
| **Data Structure** | Highly Flat or Segmented Tables (FPDS Formats) | Deeply Nested JSON Payloads |
| **Primary Small Business Filter** | `coBusSizeDeterminationCode`/`coBusSizeDeterminationName` | `recipient_type_names`/`set_aside_type_codes` |
| **Pagination Limit** | Capped at 100 Records per Request | Capped at 100 per Page (Max 1,000 Records per Query) |

Architectural Attribute
SAM.gov Contract Awards API [9]
USAspending.gov Advanced Search API [1, 3, 13]
**Endpoint URL**
`https://api.sam.gov/api/v1/contract-awards`
`https://api.usaspending.gov/api/v2/search/spending_by_award/`
**HTTP Verb**
GET
POST
**Auth Protocol**
Query Parameter (`api_key`)
Open Access (No Token Required)
**Rate Limiting**
Throttled by Tier (Requires GSA System Account)
Unrestricted / Soft-Throttled
**Data Structure**
Highly Flat or Segmented Tables (FPDS Formats)
Deeply Nested JSON Payloads
**Primary Small Business Filter**
`coBusSizeDeterminationCode`/`coBusSizeDeterminationName`
`recipient_type_names`/`set_aside_type_codes`
**Pagination Limit**
Capped at 100 Records per Request
Capped at 100 per Page (Max 1,000 Records per Query)
---

## Practical Extraction of Federal Contract Awards
To extract small business contract awards issued between June 13, 2024, and June 13, 2026, developers must execute specific queries against these federal endpoints.[3, 9]
### Querying the USAspending.gov API
Extracting records from USAspending.gov requires submitting a structured JSON payload via an HTTP POST request to the`/api/v2/search/spending_by_award/`endpoint.[13] The time period filter must explicitly target the lookback dates, and the`recipient_type_names`array must be populated with small business qualifiers.[14, 15, 16]
The request filters the data down to standard prime contracts and task orders (utilizing`award_type_codes`) while retrieving the Unique Entity Identifier (UEI) and physical location of the awardees.[3, 15, 17]
### Interrogating the SAM.gov Contract Awards API
To query SAM.gov directly, the developer must send an HTTP GET request containing the GSA-issued API key.[9] The parameters`coBusSizeDeterminationCode=S`or`coBusSizeDeterminationName=SMALL BUSINESS`isolate awards designated for small business entities.[9] Date parameters must be passed using the`createdDate`or`dateSigned`parameters in the standard bracketed range format `` [9]:
### Socioeconomic and Set-Aside Codes
When validating whether a contract award is reserved exclusively for small businesses, the pipeline should parse the set-aside fields.[4, 18] SAM.gov and USAspending.gov populate these fields using standard Federal Acquisition Regulation (FAR) codes.[19]
| Set-Aside Code | Set-Aside Description | FAR Reference |
| --- | --- | --- |
| **SBA** | Total Small Business Set-Aside [19] | FAR 19.5 |
| **SBP** | Partial Small Business Set-Aside [19] | FAR 19.5 |
| **8A** | 8(a) Set-Aside [19] | FAR 19.8 |
| **8AN** | 8(a) Sole Source [19] | FAR 19.8 |
| **HZC** | Historically Underutilized Business (HUBZone) Set-Aside [19] | FAR 19.13 |
| **HZS** | Historically Underutilized Business (HUBZone) Sole Source [19] | FAR 19.13 |
| **SDVOSBC** | Service-Disabled Veteran-Owned Small Business Set-Aside [19] | FAR 19.14 |
| **SDVOSBS** | Service-Disabled Veteran-Owned Small Business Sole Source [19] | FAR 19.14 |
| **WOSB** | SBA Certified Women-Owned Small Business Program Set-Aside [19] | FAR 19.15 |
| **WOSBSS** | SBA Certified Women-Owned Small Business Program Sole Source [19] | FAR 19.15 |
| **EDWOSB** | SBA Certified Economically Disadvantaged WOSB Set-Aside [19] | FAR 19.15 |
| **EDWOSBSS** | SBA Certified Economically Disadvantaged WOSB Sole Source [19] | FAR 19.15 |
| **IEE** | Indian Economic Enterprise (IEE) Set-Aside [19] | Dept of Interior |
| **ISBEE** | Indian Small Business Economic Enterprise Set-Aside [19] | Dept of Interior |

Set-Aside Code
Set-Aside Description
FAR Reference
**SBA**
Total Small Business Set-Aside [19]
FAR 19.5
**SBP**
Partial Small Business Set-Aside [19]
FAR 19.5
**8A**
8(a) Set-Aside [19]
FAR 19.8
**8AN**
8(a) Sole Source [19]
FAR 19.8
**HZC**
Historically Underutilized Business (HUBZone) Set-Aside [19]
FAR 19.13
**HZS**
Historically Underutilized Business (HUBZone) Sole Source [19]
FAR 19.13
**SDVOSBC**
Service-Disabled Veteran-Owned Small Business Set-Aside [19]
FAR 19.14
**SDVOSBS**
Service-Disabled Veteran-Owned Small Business Sole Source [19]
FAR 19.14
**WOSB**
SBA Certified Women-Owned Small Business Program Set-Aside [19]
FAR 19.15
**WOSBSS**
SBA Certified Women-Owned Small Business Program Sole Source [19]
FAR 19.15
**EDWOSB**
SBA Certified Economically Disadvantaged WOSB Set-Aside [19]
FAR 19.15
**EDWOSBSS**
SBA Certified Economically Disadvantaged WOSB Sole Source [19]
FAR 19.15
**IEE**
Indian Economic Enterprise (IEE) Set-Aside [19]
Dept of Interior
**ISBEE**
Indian Small Business Economic Enterprise Set-Aside [19]
Dept of Interior
---

## State, Local, and Education SLED Procurement Extraction
State and local government contract data is highly decentralized.[3, 5] Most progressive municipalities and state agencies deploy open data catalogs utilizing the Socrata platform, which exposes the standardized Socrata Open Data API (SODA) for programmatic interrogation.[20, 21, 22]
### Automated Discovery of Municipal Registries
Data pipelines can systematically identify active procurement datasets across Socrata instances by querying the global Socrata Discovery API [22, 23]:
This request returns metadata records, domain origins, and unique dataset identifiers (UIDs) for active catalogs matching the query.[23]
### Programmatic Extraction of SLED Transactions
Once a specific local repository is targeted, developers apply Socrata Query Language (SoQL) parameters to filter transactions matching the lookback window (June 13, 2024, to June 13, 2026).[22, 24, 25]
To extract contracts from Cook County signed within the target two-year window, the SODA endpoint is queried using SoQL parameters passed via URL query strings [22, 24]:
For SLED systems operating outside of the Socrata network, pipelines must interface with proprietary portals.[29, 30] For example, California's Cal eProcure manages state contract registrations through the State Contracting and Procurement Registration System (SCPRS) [29], and the Texas Comptroller manages the Texas SmartBuy and Centralized Master Bidders List (CMBL), which houses localized Historically Underutilized Business (HUB) and veteran (VetHUB) certification lists.[31, 32]
---

## Data Integration, Normalization, and Cleanse Methodologies
Merging federal contract actions with SLED procurement registries presents notable schema integration challenges.[3, 33] Federal awards reference a rigid, globally unique 12-character alphanumeric Unique Entity Identifier (UEI).[17, 33] In contrast, SLED systems record awards using free-text corporate names or localized taxpayer identification numbers.[24, 27, 29]
### Mapping to the Open Contracting Data Standard
To build a unified database, ingestion pipelines should map federal and local JSON outputs into a standardized data model.[34, 35] The Open Contracting Data Standard (OCDS) provides a structured JSON schema mapping the entire procurement lifecycle across five sequential phases [35, 36]:
To normalize the extracted fields to OCDS Award and Contract models, the fields are mapped as follows:
| Conceptual Procurement Element | SAM.gov Schema [9, 33] | SODA (Cook County) Schema [24] | OCDS Standardized Target Path [35] |
| --- | --- | --- | --- |
| **Unique Award ID** | `piid` | `contract_number` | `/awards/id` |
| **Obligated Currency Value** | `dollarsObligated` | `amount` | `/awards/value/amount` |
| **Contract Signature Date** | `dateSigned` | `start_date` | `/awards/date` |
| **Awardee Corporate Name** | `awardee.name` | `vendor_name` | `/parties[roles='supplier']/name` |
| **Awardee Registry Code** | `awardee.ueiSAM` | `vendor_number`(Local) | `/parties[roles='supplier']/id` |
| **Agency / Department** | `contractingDepartmentName` | `lead_department` | `/parties[roles='buyer']/name` |
| **Work Classification Code** | `naicsCode`/`classificationCode` | `commodity_type`(Local) | `/awards/items/classification/id` |

Conceptual Procurement Element
SAM.gov Schema [9, 33]
SODA (Cook County) Schema [24]
OCDS Standardized Target Path [35]
**Unique Award ID**
`piid`
`contract_number`
`/awards/id`
**Obligated Currency Value**
`dollarsObligated`
`amount`
`/awards/value/amount`
**Contract Signature Date**
`dateSigned`
`start_date`
`/awards/date`
**Awardee Corporate Name**
`awardee.name`
`vendor_name`
`/parties[roles='supplier']/name`
**Awardee Registry Code**
`awardee.ueiSAM`
`vendor_number`(Local)
`/parties[roles='supplier']/id`
**Agency / Department**
`contractingDepartmentName`
`lead_department`
`/parties[roles='buyer']/name`
**Work Classification Code**
`naicsCode`/`classificationCode`
`commodity_type`(Local)
`/awards/items/classification/id`
### Handling Ingestion and Cleanse Challenges
Ingestion pipelines targeting public registries encounter several data quality anomalies that must be handled defensively during the transform stage of the ETL pipeline.[33]Pagination and Slicing Temporal Windows
The USAspending.gov Advanced Search API enforces a hard ceiling of 10,000 max-paginated records per request query.[14] If a query matching small business contracts over the last two years exceeds this limit, the pipeline will fail to retrieve the complete dataset.[14] To resolve this, the data architect must calculate the total query volume and programmatically divide the query window into smaller temporal slices.[14]
To compute the total number of sequential page requestsRrequired for a targeted query slice:
R=⌈LT​⌉
WhereTrepresents the total records matching the filters, andLrepresents the limit parameter per page (capped at 100 on federal endpoints).[3, 9] IfT≥10,000, the pipeline must programmatically split the query window (e.g., from annual to monthly slices) to prevent silent truncation.[14]Aggregating Modifiable Financial Obligations
Federal contracts are frequently amended, with each modification recorded as an independent transaction row.[17, 37] To calculate the absolute obligation valueOtotal​of a contract vehicle across its execution timeline, the database must sum the individual transactions [37]:
Ototal​=t=1∑N​δt​
Whereδt​represents the financial obligation of modification transactiont, andNrepresents the cumulative count of modifications associated with the unique Contract ID.[9, 17]Literal "null" String Cleanse
Exclusion records and nested SLED fields frequently output literal four-character string variants like`"null"`,`"none"`, or`"n/a"`instead of a database null object.[33] If uncorrected, database queries utilizing standard`WHERE field IS NULL`syntax fail to recognize these rows, causing filtering mechanisms to miss up to 73% of exclusions or missing fields.[33] Ingestion code must explicitly transform these literal strings into proper database NULL types.[33]NAICS Code and Spatial Type Inconsistencies
SAM.gov occasionally returns`naicsCode`as a flat string representing a single code, and other times as an array under`naicsCodes`.[33] Socrata portals often exhibit similar type variability on spatial coordinates.[33] The ingestion layer must inspect the data type at runtime and cast values to a single standard format.[33]Inconsistent Date Formatting
SAM.gov mixes simple date strings (e.g.,`"2025-11-01"`) with ISO 8601 timestamps containing offset parameters (e.g.,`"2025-11-30T17:00:00-05:00"`) within the same record schema.[33] Standardizing all incoming dates to UTC ISO format is required before database insertion.[33, 38]Free-Text and Typographical Contamination
Clerical errors during manual data entry can result in contract awards dated in future eras (such as the year 3025).[33] Additionally, in approximately 20% of messy registry variants, the vendor name field contains concatenated mailing address details (e.g.,`"ACME CORP 123 MAIN ST CHESAPEAKE VA"`).[33] The pipeline must implement value validations to catch outlier dates and use full-text search indexing to navigate unstructured text.[33]
---

## Third-Party Aggregation Alternatives
For organization types that lack the infrastructure to maintain continuous web scraping pipelines and custom API connectors, utilizing third-party commercial databases is a highly viable alternative.[5, 39, 40]
---

## Unified Python Integration Script
To integrate these data sources, developers can deploy a unified Python-based ETL pipeline. This script connects to the USAspending.gov Advanced Search API, queries Socrata-powered SLED databases, normalizes the schemas to a unified OCDS-aligned layout, and applies rigorous data cleansing.[3, 13, 24, 27]
---

## Operational Strategies for Capture and Competitive Intelligence
Establishing a unified pipeline combining federal and SLED small business awards offers significant strategic advantages for business development and capture operations.[2, 4]
### Proactive Recompete Analysis
The standard contract lifecycle follows a predictable timeline, typically spanning a base year followed by several option years.[12, 43] By tracking the signature date and period of performance end dates on small business awards, capture teams can forecast when contracts are likely to be recompeted.[18, 42, 43]
Identifying expiring contracts 12 to 18 months before option years conclude allows firms to engage buying agencies and establish teaming partnerships well before formal RFPs are released.[18, 42]
### Validating Geographic Demand Trends
Using location parameters (e.g., Place of Performance State or Zip Code) [8, 9, 24] allows firms to cross-validate regional demand trends.[4] For example, if SAM.gov shows rising federal award volumes in a specific region and local SLED portals confirm matching growth, it provides a strong signal to prioritize business development resources in that territory.[4]
### Competitor Profiling and Teaming Strategy
Analyzing small business awards over a two-year window reveals which competitors are winning contracts within target agencies.[2, 4] Identifying these prime contractors helps small businesses position themselves as sub-contracting partners on upcoming bids, while mid-tier firms can locate qualified small business partners to meet socio-economic set-aside requirements.[11, 18, 42]
---
