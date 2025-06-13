# MoMo Data Analysis Summative

This project analyzes mobile money (MoMo) SMS data to extract and present transaction insights through a web-based frontend.

## Project Overview

Users export their SMS messages in XML format (commonly via SMS backup apps). This tool parses the XML and extracts financial transactions (incoming transfers, payments, withdrawals, etc.). The resulting data is rendered in a browser-based dashboard for analyxsis.

## Features

- Extracts structured data from SMS messages in `script.xml`
- Classifies transaction types (e.g., payments, bundles, withdrawals)
- Renders interactive transaction tables in HTML
- Basic transaction visualization and user-friendly interface