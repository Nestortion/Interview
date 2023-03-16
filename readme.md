# Simple Chat application for ASG internship Assessment

## How to setup and run application

### Prerequisites

- Node.js version >= 18.11.0
- MYSQL server

### How to develop and run locally

1. Create a MySQL database named `chat_db` and import the sql file that can be downloaded here https://drive.google.com/file/d/1SUX7ULBlzkBFGz9nJal3Hs4PITC5NMDL/view
2. Clone the repo
3. Create a `.env` file on the client. Make sure to use the `.env.example` as reference guide for the environment variables

- the `.env` file should be located on `server/.env`

4. To install the packages for the front-end and back-end, go to each directory for the front-end and server from the root folder and then open up a terminal and run.

```console
$ npm install
```

5. To run both front-end and back-end, open up 2 terminals where 1 is for the front-end and 1 for the back-end. In the front-end terminal, run.

```console
cd front-end
$ npm run dev
```

6. For the back-end terminal, run.

```console
cd back-end
$ npm run dev
```
