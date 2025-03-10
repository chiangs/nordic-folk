// React
import { useEffect } from "react";
// Remix
import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
// Styles
import normalizeStylesUrl from "~styles/__normalize.css";
import globalStylesUrl from "~styles/global.css";
import utilityClassesUrl from "~styles/utils.css";
// App
import { getUser } from "./session.server";
import { gtag } from "~utils";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: normalizeStylesUrl,
    },
    {
      rel: "stylesheet",
      href: globalStylesUrl,
    },
    {
      rel: "stylesheet",
      href: utilityClassesUrl,
    },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Remix Notes",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  gaTrackingId: string | undefined;
};

export const loader: LoaderFunction = async ({ request }) => {
  // * Remember to add the env variable for production!
  return json<LoaderData>({
    user: await getUser(request),
    gaTrackingId: process.env.GA_TRACKING_ID,
  });
};

const GA = ({ trackingId }: { trackingId: string }): JSX.Element => (
  <>
    <script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
    />
    <script
      async
      id="gtag-init"
      dangerouslySetInnerHTML={{
        __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${trackingId}');
              `,
      }}
    />
  </>
);

export default function App() {
  const { gaTrackingId, user } = useLoaderData<LoaderData>();
  const location = useLocation();

  // GA pageview
  useEffect(() => {
    if (gaTrackingId?.length) {
      gtag.pageview(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  // GA main script load
  const gtagScript =
    process.env.NODE_ENV === "development" || !gaTrackingId ? null : (
      <GA trackingId={gaTrackingId} />
    );

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
        {gtagScript}
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
