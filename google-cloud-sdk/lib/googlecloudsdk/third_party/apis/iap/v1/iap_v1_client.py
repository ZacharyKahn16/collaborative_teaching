"""Generated client library for iap version v1."""
# NOTE: This file is autogenerated and should not be edited by hand.
from apitools.base.py import base_api
from googlecloudsdk.third_party.apis.iap.v1 import iap_v1_messages as messages


class IapV1(base_api.BaseApiClient):
  """Generated client library for service iap version v1."""

  MESSAGES_MODULE = messages
  BASE_URL = u'https://iap.googleapis.com/'
  MTLS_BASE_URL = u''

  _PACKAGE = u'iap'
  _SCOPES = [u'https://www.googleapis.com/auth/cloud-platform']
  _VERSION = u'v1'
  _CLIENT_ID = '1042881264118.apps.googleusercontent.com'
  _CLIENT_SECRET = 'x_Tw5K8nnjoRAqULM9PFAC2b'
  _USER_AGENT = 'x_Tw5K8nnjoRAqULM9PFAC2b'
  _CLIENT_CLASS_NAME = u'IapV1'
  _URL_VERSION = u'v1'
  _API_KEY = None

  def __init__(self, url='', credentials=None,
               get_credentials=True, http=None, model=None,
               log_request=False, log_response=False,
               credentials_args=None, default_global_params=None,
               additional_http_headers=None, response_encoding=None):
    """Create a new iap handle."""
    url = url or self.BASE_URL
    super(IapV1, self).__init__(
        url, credentials=credentials,
        get_credentials=get_credentials, http=http, model=model,
        log_request=log_request, log_response=log_response,
        credentials_args=credentials_args,
        default_global_params=default_global_params,
        additional_http_headers=additional_http_headers,
        response_encoding=response_encoding)
    self.projects_brands_identityAwareProxyClients = self.ProjectsBrandsIdentityAwareProxyClientsService(self)
    self.projects_brands = self.ProjectsBrandsService(self)
    self.projects = self.ProjectsService(self)
    self.v1 = self.V1Service(self)

  class ProjectsBrandsIdentityAwareProxyClientsService(base_api.BaseApiService):
    """Service class for the projects_brands_identityAwareProxyClients resource."""

    _NAME = u'projects_brands_identityAwareProxyClients'

    def __init__(self, client):
      super(IapV1.ProjectsBrandsIdentityAwareProxyClientsService, self).__init__(client)
      self._upload_configs = {
          }

    def Create(self, request, global_params=None):
      r"""Creates an Identity Aware Proxy (IAP) OAuth client. The client is owned.
by IAP. Requires that the brand for the project exists and that it is
set for internal-only use.

      Args:
        request: (IapProjectsBrandsIdentityAwareProxyClientsCreateRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (IdentityAwareProxyClient) The response message.
      """
      config = self.GetMethodConfig('Create')
      return self._RunMethod(
          config, request, global_params=global_params)

    Create.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}/identityAwareProxyClients',
        http_method=u'POST',
        method_id=u'iap.projects.brands.identityAwareProxyClients.create',
        ordered_params=[u'parent'],
        path_params=[u'parent'],
        query_params=[],
        relative_path=u'v1/{+parent}/identityAwareProxyClients',
        request_field=u'identityAwareProxyClient',
        request_type_name=u'IapProjectsBrandsIdentityAwareProxyClientsCreateRequest',
        response_type_name=u'IdentityAwareProxyClient',
        supports_download=False,
    )

    def Delete(self, request, global_params=None):
      r"""Deletes an Identity Aware Proxy (IAP) OAuth client. Useful for removing.
obsolete clients, managing the number of clients in a given project, and
cleaning up after tests. Requires that the client is owned by IAP.

      Args:
        request: (IapProjectsBrandsIdentityAwareProxyClientsDeleteRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (Empty) The response message.
      """
      config = self.GetMethodConfig('Delete')
      return self._RunMethod(
          config, request, global_params=global_params)

    Delete.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}/identityAwareProxyClients/{identityAwareProxyClientsId}',
        http_method=u'DELETE',
        method_id=u'iap.projects.brands.identityAwareProxyClients.delete',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[],
        relative_path=u'v1/{+name}',
        request_field='',
        request_type_name=u'IapProjectsBrandsIdentityAwareProxyClientsDeleteRequest',
        response_type_name=u'Empty',
        supports_download=False,
    )

    def Get(self, request, global_params=None):
      r"""Retrieves an Identity Aware Proxy (IAP) OAuth client.
Requires that the client is owned by IAP.

      Args:
        request: (IapProjectsBrandsIdentityAwareProxyClientsGetRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (IdentityAwareProxyClient) The response message.
      """
      config = self.GetMethodConfig('Get')
      return self._RunMethod(
          config, request, global_params=global_params)

    Get.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}/identityAwareProxyClients/{identityAwareProxyClientsId}',
        http_method=u'GET',
        method_id=u'iap.projects.brands.identityAwareProxyClients.get',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[],
        relative_path=u'v1/{+name}',
        request_field='',
        request_type_name=u'IapProjectsBrandsIdentityAwareProxyClientsGetRequest',
        response_type_name=u'IdentityAwareProxyClient',
        supports_download=False,
    )

    def List(self, request, global_params=None):
      r"""Lists the existing clients for the brand.

      Args:
        request: (IapProjectsBrandsIdentityAwareProxyClientsListRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (ListIdentityAwareProxyClientsResponse) The response message.
      """
      config = self.GetMethodConfig('List')
      return self._RunMethod(
          config, request, global_params=global_params)

    List.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}/identityAwareProxyClients',
        http_method=u'GET',
        method_id=u'iap.projects.brands.identityAwareProxyClients.list',
        ordered_params=[u'parent'],
        path_params=[u'parent'],
        query_params=[u'pageSize', u'pageToken'],
        relative_path=u'v1/{+parent}/identityAwareProxyClients',
        request_field='',
        request_type_name=u'IapProjectsBrandsIdentityAwareProxyClientsListRequest',
        response_type_name=u'ListIdentityAwareProxyClientsResponse',
        supports_download=False,
    )

    def ResetSecret(self, request, global_params=None):
      r"""Resets an Identity Aware Proxy (IAP) OAuth client secret. Useful if the.
secret was compromised. Requires that the client is owned by IAP.

      Args:
        request: (IapProjectsBrandsIdentityAwareProxyClientsResetSecretRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (IdentityAwareProxyClient) The response message.
      """
      config = self.GetMethodConfig('ResetSecret')
      return self._RunMethod(
          config, request, global_params=global_params)

    ResetSecret.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}/identityAwareProxyClients/{identityAwareProxyClientsId}:resetSecret',
        http_method=u'POST',
        method_id=u'iap.projects.brands.identityAwareProxyClients.resetSecret',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[],
        relative_path=u'v1/{+name}:resetSecret',
        request_field=u'resetIdentityAwareProxyClientSecretRequest',
        request_type_name=u'IapProjectsBrandsIdentityAwareProxyClientsResetSecretRequest',
        response_type_name=u'IdentityAwareProxyClient',
        supports_download=False,
    )

  class ProjectsBrandsService(base_api.BaseApiService):
    """Service class for the projects_brands resource."""

    _NAME = u'projects_brands'

    def __init__(self, client):
      super(IapV1.ProjectsBrandsService, self).__init__(client)
      self._upload_configs = {
          }

    def Create(self, request, global_params=None):
      r"""Constructs a new OAuth brand for the project if one does not exist.
The created brand is "internal only", meaning that OAuth clients created
under it only accept requests from users who belong to the same G Suite
organization as the project. The brand is created in an un-reviewed status.
NOTE: The "internal only" status can be manually changed in the Google
Cloud console. Requires that a brand does not already exist for the
project, and that the specified support email is owned by the caller.

      Args:
        request: (IapProjectsBrandsCreateRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (Brand) The response message.
      """
      config = self.GetMethodConfig('Create')
      return self._RunMethod(
          config, request, global_params=global_params)

    Create.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands',
        http_method=u'POST',
        method_id=u'iap.projects.brands.create',
        ordered_params=[u'parent'],
        path_params=[u'parent'],
        query_params=[],
        relative_path=u'v1/{+parent}/brands',
        request_field=u'brand',
        request_type_name=u'IapProjectsBrandsCreateRequest',
        response_type_name=u'Brand',
        supports_download=False,
    )

    def Get(self, request, global_params=None):
      r"""Retrieves the OAuth brand of the project.

      Args:
        request: (IapProjectsBrandsGetRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (Brand) The response message.
      """
      config = self.GetMethodConfig('Get')
      return self._RunMethod(
          config, request, global_params=global_params)

    Get.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands/{brandsId}',
        http_method=u'GET',
        method_id=u'iap.projects.brands.get',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[],
        relative_path=u'v1/{+name}',
        request_field='',
        request_type_name=u'IapProjectsBrandsGetRequest',
        response_type_name=u'Brand',
        supports_download=False,
    )

    def List(self, request, global_params=None):
      r"""Lists the existing brands for the project.

      Args:
        request: (IapProjectsBrandsListRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (ListBrandsResponse) The response message.
      """
      config = self.GetMethodConfig('List')
      return self._RunMethod(
          config, request, global_params=global_params)

    List.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/projects/{projectsId}/brands',
        http_method=u'GET',
        method_id=u'iap.projects.brands.list',
        ordered_params=[u'parent'],
        path_params=[u'parent'],
        query_params=[],
        relative_path=u'v1/{+parent}/brands',
        request_field='',
        request_type_name=u'IapProjectsBrandsListRequest',
        response_type_name=u'ListBrandsResponse',
        supports_download=False,
    )

  class ProjectsService(base_api.BaseApiService):
    """Service class for the projects resource."""

    _NAME = u'projects'

    def __init__(self, client):
      super(IapV1.ProjectsService, self).__init__(client)
      self._upload_configs = {
          }

  class V1Service(base_api.BaseApiService):
    """Service class for the v1 resource."""

    _NAME = u'v1'

    def __init__(self, client):
      super(IapV1.V1Service, self).__init__(client)
      self._upload_configs = {
          }

    def GetIamPolicy(self, request, global_params=None):
      r"""Gets the access control policy for an Identity-Aware Proxy protected.
resource.
More information about managing access via IAP can be found at:
https://cloud.google.com/iap/docs/managing-access#managing_access_via_the_api

      Args:
        request: (IapGetIamPolicyRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (Policy) The response message.
      """
      config = self.GetMethodConfig('GetIamPolicy')
      return self._RunMethod(
          config, request, global_params=global_params)

    GetIamPolicy.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/{v1Id}:getIamPolicy',
        http_method=u'POST',
        method_id=u'iap.getIamPolicy',
        ordered_params=[u'resource'],
        path_params=[u'resource'],
        query_params=[],
        relative_path=u'v1/{+resource}:getIamPolicy',
        request_field=u'getIamPolicyRequest',
        request_type_name=u'IapGetIamPolicyRequest',
        response_type_name=u'Policy',
        supports_download=False,
    )

    def GetIapSettings(self, request, global_params=None):
      r"""Gets the IAP settings on a particular IAP protected resource.

      Args:
        request: (IapGetIapSettingsRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (IapSettings) The response message.
      """
      config = self.GetMethodConfig('GetIapSettings')
      return self._RunMethod(
          config, request, global_params=global_params)

    GetIapSettings.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/{v1Id}:iapSettings',
        http_method=u'GET',
        method_id=u'iap.getIapSettings',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[],
        relative_path=u'v1/{+name}:iapSettings',
        request_field='',
        request_type_name=u'IapGetIapSettingsRequest',
        response_type_name=u'IapSettings',
        supports_download=False,
    )

    def SetIamPolicy(self, request, global_params=None):
      r"""Sets the access control policy for an Identity-Aware Proxy protected.
resource. Replaces any existing policy.
More information about managing access via IAP can be found at:
https://cloud.google.com/iap/docs/managing-access#managing_access_via_the_api

      Args:
        request: (IapSetIamPolicyRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (Policy) The response message.
      """
      config = self.GetMethodConfig('SetIamPolicy')
      return self._RunMethod(
          config, request, global_params=global_params)

    SetIamPolicy.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/{v1Id}:setIamPolicy',
        http_method=u'POST',
        method_id=u'iap.setIamPolicy',
        ordered_params=[u'resource'],
        path_params=[u'resource'],
        query_params=[],
        relative_path=u'v1/{+resource}:setIamPolicy',
        request_field=u'setIamPolicyRequest',
        request_type_name=u'IapSetIamPolicyRequest',
        response_type_name=u'Policy',
        supports_download=False,
    )

    def TestIamPermissions(self, request, global_params=None):
      r"""Returns permissions that a caller has on the Identity-Aware Proxy protected.
resource.
More information about managing access via IAP can be found at:
https://cloud.google.com/iap/docs/managing-access#managing_access_via_the_api

      Args:
        request: (IapTestIamPermissionsRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (TestIamPermissionsResponse) The response message.
      """
      config = self.GetMethodConfig('TestIamPermissions')
      return self._RunMethod(
          config, request, global_params=global_params)

    TestIamPermissions.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/{v1Id}:testIamPermissions',
        http_method=u'POST',
        method_id=u'iap.testIamPermissions',
        ordered_params=[u'resource'],
        path_params=[u'resource'],
        query_params=[],
        relative_path=u'v1/{+resource}:testIamPermissions',
        request_field=u'testIamPermissionsRequest',
        request_type_name=u'IapTestIamPermissionsRequest',
        response_type_name=u'TestIamPermissionsResponse',
        supports_download=False,
    )

    def UpdateIapSettings(self, request, global_params=None):
      r"""Updates the IAP settings on a particular IAP protected resource. It.
replaces all fields unless the `update_mask` is set.

      Args:
        request: (IapUpdateIapSettingsRequest) input message
        global_params: (StandardQueryParameters, default: None) global arguments
      Returns:
        (IapSettings) The response message.
      """
      config = self.GetMethodConfig('UpdateIapSettings')
      return self._RunMethod(
          config, request, global_params=global_params)

    UpdateIapSettings.method_config = lambda: base_api.ApiMethodInfo(
        flat_path=u'v1/{v1Id}:iapSettings',
        http_method=u'PATCH',
        method_id=u'iap.updateIapSettings',
        ordered_params=[u'name'],
        path_params=[u'name'],
        query_params=[u'updateMask'],
        relative_path=u'v1/{+name}:iapSettings',
        request_field=u'iapSettings',
        request_type_name=u'IapUpdateIapSettingsRequest',
        response_type_name=u'IapSettings',
        supports_download=False,
    )
