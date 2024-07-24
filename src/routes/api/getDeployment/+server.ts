import type { RequestHandler } from '@sveltejs/kit';
import { json, redirect, isRedirect } from '@sveltejs/kit';

// TODO: (when needed) Figure out a fix for ESLint 'import/no-unresolved' error on '$env/static/public'
// eslint-disable-next-line import-x/no-unresolved
import * as env from '$env/static/private';

interface Badge {
  label?: string | null;
  message: string;
  color: string;
  style?: string | null;
  logo?: string | null;
}

async function createBadge(badge: Badge) {
  const url = new URL(`http://img.shields.io/badge/label-${badge.message}-${badge.color}`);
  url.searchParams.append('style', badge.style ?? '');
  url.searchParams.append('logo', badge.logo ?? '');
  url.searchParams.append('label', badge.label ?? '');

  const response = await fetch(url);
  const body = await response.text();
  return body;
}

const ShieldsIO = { createBadge };
// export default ShieldsIO;

const generateBadge = async (
  statusCode: number = 404,
  statusText: string | null = null,
  badgeName: string,
  badgeStyle: string | null = null,
  badgeLogo: string | null = null
) => {
  const badgeOptions = {
    label: badgeName,
    message: statusText ?? 'deployed',
    color: 'brightgreen',
    style: badgeStyle,
    logo: badgeLogo
  };

  if (statusCode <= 599 && statusCode >= 500) {
    // 500 - 599 -> Server Errors
    badgeOptions.message = statusText ?? 'failed';
    badgeOptions.color = 'red';
  } else if (statusCode <= 499 && statusCode >= 400) {
    // 400 - 499 -> Client Errors
    badgeOptions.message = statusText ?? 'not found';
    badgeOptions.color = 'lightgrey';
  } else if (statusCode <= 399 && statusCode >= 300) {
    // 300 - 399 -> Redirects
  }

  // 200 - 299 -> Successful Responses
  // 100 - 199 -> Informational Responses
  return await ShieldsIO.createBadge(badgeOptions);
};

export const GET: RequestHandler = async ({ url }) => {
  const what = url.searchParams.get('what') ?? url.searchParams.get('w') ?? 'svg';
  const branch = url.searchParams.get('branch') ?? url.searchParams.get('b') ?? 'main';
  const environment =
    url.searchParams.get('environment') ??
    url.searchParams.get('e') ??
    (branch.toLowerCase() === 'main' ? 'production' : 'preview');
  const style = url.searchParams.get('style') ?? url.searchParams.get('s') ?? null;

  if (!branch) {
    return json({ error: 'Branch parameter is required' }, { status: 400 });
  }

  const headers = {
    Authorization: `token ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  };

  try {
    // Step 1: Fetch the latest commit SHA for the branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commits/${branch}`,
      { headers }
    );
    const refData = await refResponse.json();

    if (!refData || !refData.sha) {
      return json({ error: 'Error fetching the latest commit for the branch' }, { status: 500 });
    }

    const latestCommitSha = refData.sha;

    // Step 2: Fetch deployments
    const deploymentsResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/deployments`,
      { headers }
    );
    const deployments = await deploymentsResponse.json();

    if (!Array.isArray(deployments)) {
      return json({ error: 'Error fetching deployments from GitHub' }, { status: 500 });
    }

    // Step 3: Filter deployments for the specified branch and environment
    const filteredDeployments = deployments.filter(
      (deployment) =>
        (deployment?.environment ?? '').toLowerCase() === environment.toLowerCase() &&
        (deployment?.sha ?? '').toLowerCase() === latestCommitSha.toLowerCase()
    );

    if (filteredDeployments.length === 0) {
      return json(
        { error: 'No deployments found for the specified branch and environment' },
        { status: 404 }
      );
    }

    const latestDeployment = filteredDeployments[0];

    // Step 4: Fetch deployment statuses
    if (!latestDeployment?.statuses_url) {
      return json({ error: `Latest deployment statuses url is empty` }, { status: 500 });
    }

    const deploymentStatusResponse = await fetch(latestDeployment.statuses_url, { headers });
    if (!deploymentStatusResponse.ok) {
      return json(
        { error: `Error fetching deployment statuses: ${deploymentStatusResponse.statusText}` },
        { status: deploymentStatusResponse.status }
      );
    }

    const statuses = await deploymentStatusResponse.json();
    if (!statuses || statuses.length === 0) {
      return json(
        { error: `Error fetching deployment statuses: no statuses returned.` },
        { status: 500 }
      );
    }
    const status = statuses[0];
    const latestStatus = status?.state ?? 'unknown';
    const deploymentUrl = status.environment_url ?? '';

    // Step 5: Generate badge
    let statusCode = 200;
    if (latestStatus.toLowerCase() === 'success') statusCode = 200;
    else if (latestStatus.toLowerCase() === 'error') statusCode = 500;
    else if (latestStatus.toLowerCase() === 'failure') statusCode = 500;
    else if (latestStatus.toLowerCase() === 'pending') statusCode = 400;
    else if (latestStatus.toLowerCase() === 'inactive') statusCode = 400;
    /*
    "success": The deployment was successful and completed without any issues.
    "error": The deployment encountered an error and failed to complete.
    "failure": The deployment failed, possibly due to tests not passing or other criteria not being met.
    "pending": The deployment is still in progress or waiting to be processed.
    "inactive": This state is specific to transient deployments. When you set a transient deployment to inactive, it will be shown as destroyed in GitHub
    */
    const badge = await generateBadge(statusCode, latestStatus, 'vercel', 'vercel', style);
    if (what.toLowerCase() === 'svg' && badge) {
      return new Response(badge, {
        headers: {
          'Content-Type': 'image/svg+xml'
        }
      });
    } else if (what.toLowerCase() === 'url' && deploymentUrl) {
      // 307 Temporary Redirect
      // throw redirect(307, '/home');
      redirect(307, deploymentUrl);
    }
    // Format the result
    return json(
      {
        status: latestStatus,
        url: deploymentUrl,
        branch,
        environment: environment.toLowerCase(),
        // ? badge: JSON.stringify(badge)
        badge
      },
      { status: 200 }
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    function isErrorWithMessage(error: unknown): error is { message: string } {
      return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      );
    }

    console.error('Error:', error);
    return json(
      { error: isErrorWithMessage(error) ? error.message : 'unexpected error' },
      { status: 500 }
    );
  }
};
