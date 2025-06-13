# MoMo Data Analysis Summative

This project analyzes mobile money (MoMo) SMS data to extract and present transaction insights through a web-based frontend.

## Project Overview

Users export their SMS messages in XML format (commonly via SMS backup apps). This tool parses the XML and extracts financial transactions (incoming transfers, payments, withdrawals, etc.). The resulting data is rendered in a browser-based dashboard for analyxsis.

## Features

- Extracts structured data from SMS messages in `script.xml`
- Classifies transaction types (e.g., payments, bundles, withdrawals)
- Renders interactive transaction tables in HTML
- Basic transaction visualization and user-friendly interface

## How to Use

1. Place your SMS XML backup in the `Data/` folder.
2. Open `frontend/index.html` in a browser.
3. The dashboard will parse the data and display a summary table (if integrated with backend parsing).

Currently, the JS file uses mock data — backend parsing is required to fully integrate the XML data.

## Technologies Used

- HTML5, CSS3
- JavaScript (Vanilla)
- XML for data input